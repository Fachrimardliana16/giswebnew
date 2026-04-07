// js/modules/eventManager.js

/**
 * Event manager for application state and communication
 */
class EventManager {
  constructor() {
    this.state = {
      statusFilter: null,
      tarifFilter: null,
      validFilter: null,
      umurWMFilter: null,
      cabangFilter: null,
      tunggakanFilter: null,
      complaintStatusFilter: null
    };

    this.subscribers = {
      statusFilter: [],
      tarifFilter: [],
      validFilter: [],
      umurWMFilter: [],
      cabangFilter: [],
      tunggakanFilter: [],
      complaintStatusFilter: []
    };
  }

  /**
   * Reset all filters to null
   */
  clearFilters() {
    this.state = {
      statusFilter: null,
      tarifFilter: null,
      validFilter: null,
      umurWMFilter: null,
      cabangFilter: null,
      tunggakanFilter: null,
      complaintStatusFilter: null
    };

    Object.keys(this.subscribers).forEach(event => {
      this.notifySubscribers(event, null);
    });
  }

  /**
   * Set multiple filters at once
   * @param {Object} filters - Object with filter values
   */
  setFilters(filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (this.state[key] !== value) {
        this.state[key] = value;
        this.notifySubscribers(key, value);
      }
    });
  }

  /**
   * Set status filter
   * @param {string} value - Filter value
   */
  setStatusFilter(value) {
    this.state.statusFilter = value;
    this.notifySubscribers('statusFilter', value);
  }

  /**
   * Set cabang filter
   * @param {string} value - Filter value
   */
  setCabangFilter(value) {
    this.state.cabangFilter = value;
    this.notifySubscribers('cabangFilter', value);
  }

  /**
   * Set tariff filter
   * @param {string} value - Filter value
   */
  setTarifFilter(value) {
    this.state.tarifFilter = value;
    this.notifySubscribers('tarifFilter', value);
  }

  /**
   * Set validity filter
   * @param {string} value - Filter value
   */
  setValidFilter(value) {
    this.state.validFilter = value;
    this.notifySubscribers('validFilter', value);
  }

  /**
   * Set water meter age filter
   * @param {string} value - Filter value
   */
  setUmurWMFilter(value) {
    this.state.umurWMFilter = value;
    this.notifySubscribers('umurWMFilter', value);
  }

  /**
   * Set tunggakan filter
   * @param {Array} values - Array of tunggakan values
   */
  setTunggakanFilter(values) {
    this.state.tunggakanFilter = values;
    this.notifySubscribers('tunggakanFilter', values);
  }

  /**
   * Set complaint status filter
   * @param {string} value - Filter value
   */
  setComplaintStatusFilter(value) {
    this.state.complaintStatusFilter = value;
    this.notifySubscribers('complaintStatusFilter', value);
  }

  /**
   * Get status filter
   * @returns {string|null} Current filter value
   */
  getStatusFilter() {
    return this.state.statusFilter;
  }

  /**
   * Get cabang filter
   * @returns {string|null} Current filter value
   */
  getCabangFilter() {
    return this.state.cabangFilter;
  }

  /**
   * Get tariff filter
   * @returns {string|null} Current filter value
   */
  getTarifFilter() {
    return this.state.tarifFilter;
  }

  /**
   * Get validity filter
   * @returns {string|null} Current filter value
   */
  getValidFilter() {
    return this.state.validFilter;
  }

  /**
   * Get water meter age filter
   * @returns {string|null} Current filter value
   */
  getUmurWMFilter() {
    return this.state.umurWMFilter;
  }

  /**
   * Get tunggakan filter
   * @returns {Array|null} Current tunggakan values
   */
  getTunggakanFilter() {
    return this.state.tunggakanFilter;
  }

  /**
   * Get complaint status filter
   * @returns {string|null} Current filter value
   */
  getComplaintStatusFilter() {
    return this.state.complaintStatusFilter;
  }

  /**
   * Get all active filters
   * @returns {Object} Object with all filter values
   */
  getAllFilters() {
    return {
      status: this.state.statusFilter,
      cabang: this.state.cabangFilter,
      tarif: this.state.tarifFilter,
      valid: this.state.validFilter,
      umurWM: this.state.umurWMFilter,
      tunggakan: this.state.tunggakanFilter,
      complaintStatus: this.state.complaintStatusFilter
    };
  }

  /**
   * Subscribe to filter changes
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  subscribe(event, callback) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    this.subscribers[event].push(callback);
  }

  /**
   * Notify subscribers of filter changes
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  notifySubscribers(event, data) {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach(callback => callback(data));
    }
  }
}

export const eventManager = new EventManager();
