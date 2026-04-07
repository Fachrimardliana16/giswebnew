import { GEOSERVER_URL } from './config.js';

/**
 * Make a GetFeatureInfo request to GeoServer
 * @param {Object} map - Leaflet map instance
 * @param {string} layerName - Layer name
 * @param {Object} clickPoint - Click point coordinates
 * @param {Object} options - Additional options
 * @returns {Promise} Promise with feature info
 */
export const makeGetFeatureInfoRequest = (map, layerName, clickPoint, options = {}) => {
  try {
    const point = map.latLngToContainerPoint(clickPoint);
    const size = map.getSize();
    const bounds = map.getBounds();

    const params = {
      REQUEST: 'GetFeatureInfo',
      SERVICE: 'WMS',
      SRS: 'EPSG:4326',
      VERSION: '1.1.1',
      BBOX: bounds.toBBoxString(),
      HEIGHT: size.y,
      WIDTH: size.x,
      LAYERS: `webgis:${layerName}`,
      QUERY_LAYERS: `webgis:${layerName}`,
      INFO_FORMAT: 'application/json',
      FEATURE_COUNT: 50,
      X: Math.round(point.x),
      Y: Math.round(point.y),
      BUFFER: options.buffer || 10
    };

    if (options.cqlFilter) {
      params.CQL_FILTER = options.cqlFilter;
    }

    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    const url = `${GEOSERVER_URL}?${queryString}`;
    console.debug(`Fetching GetFeatureInfo for ${layerName}`);

    return fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .catch(error => {
        console.error(`GetFeatureInfo error for ${layerName}:`, error);
        throw error;
      });
  } catch (error) {
    console.error(`Error preparing GetFeatureInfo request for ${layerName}:`, error);
    return Promise.reject(error);
  }
};

/**
 * Search for features by property
 * @param {string} layerName - Layer name
 * @param {string} property - Property to search
 * @param {string} searchText - Search text
 * @returns {Promise} Promise with search results
 */
export const searchFeaturesByProperty = (layerName, property, searchText) => {
  const wfsUrl = GEOSERVER_URL.replace('/wms', '/wfs');
  const cqlFilter = `${property}%20ILIKE%20%27%25${encodeURIComponent(searchText)}%25%27`;

  const url = `${wfsUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=webgis:${layerName}&CQL_FILTER=${cqlFilter}&outputFormat=application/json`;

  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
    })
    .catch(error => {
      console.error('Search error:', error);
      throw error;
    });
};

/**
 * Fetch layer capabilities from GeoServer
 * @param {string} layerName - Layer name
 * @returns {Promise} Promise with layer capabilities
 */
export const getLayerCapabilities = (layerName) => {
  const url = `${GEOSERVER_URL}?service=WMS&version=1.1.1&request=GetCapabilities&layers=webgis:${layerName}`;

  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      const parser = new DOMParser();
      return parser.parseFromString(data, 'application/xml');
    })
    .catch(error => {
      console.error(`Error fetching capabilities for ${layerName}:`, error);
      throw error;
    });
};

/**
 * Get feature description from GeoServer
 * @param {string} layerName - Layer name
 * @returns {Promise} Promise with feature description
 */
export const getFeatureDescription = (layerName) => {
  const wfsUrl = GEOSERVER_URL.replace('/wms', '/wfs');
  const url = `${wfsUrl}?service=WFS&version=1.1.0&request=DescribeFeatureType&typeName=webgis:${layerName}&outputFormat=application/json`;

  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
    })
    .catch(error => {
      console.error(`Error fetching feature description for ${layerName}:`, error);
      throw error;
    });
};

/**
 * Utility function to handle fetch errors
 * @param {Response} response - Fetch response
 * @returns {Promise} Response or error
 */
export const handleFetchResponse = (response) => {
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};
