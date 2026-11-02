<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GeoServerProxyTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'admin']);
        $this->user = User::create([
            'username' => 'admin_uji',
            'password' => 'rahasia123',
            'role_id' => $role->id,
        ]);

        config([
            'gis.geoserver_url' => 'http://geoserver-uji.local/wms',
            'gis.geoserver_wfs_url' => 'http://geoserver-uji.local/ows',
        ]);
    }

    public function test_tanpa_parameter_request_ditolak(): void
    {
        $this->actingAs($this->user)->get('/geo-proxy')->assertStatus(400);
    }

    public function test_getfeature_dibatasi_maxfeatures(): void
    {
        Http::fake([
            'geoserver-uji.local/*' => Http::response(
                '{"type":"FeatureCollection","features":[]}', 200,
                ['Content-Type' => 'application/json']
            ),
        ]);

        $this->actingAs($this->user)
            ->get('/geo-proxy?service=WFS&request=GetFeature&typeName=x&maxFeatures=99999999&outputFormat=application/json');

        Http::assertSent(function ($request) {
            $data = $request->data();

            return (string) ($data['maxfeatures'] ?? $data['maxFeatures'] ?? '') === '50';
        });
    }

    public function test_getfeature_propertyname_dipaksa_whitelist(): void
    {
        Http::fake([
            'geoserver-uji.local/*' => Http::response('{"type":"FeatureCollection","features":[]}', 200),
        ]);

        $this->actingAs($this->user)
            ->get('/geo-proxy?service=WFS&request=GetFeature&typeName=x&propertyName=geom,password_rahasia');

        Http::assertSent(function ($request) {
            $data = $request->data();
            $pn = $data['propertyname'] ?? $data['propertyName'] ?? '';

            return ! str_contains($pn, 'geom')
                && ! str_contains($pn, 'password')
                && str_contains($pn, 'nama');
        });
    }

    public function test_getmap_lebih_dari_4096_ditolak(): void
    {
        $this->actingAs($this->user)
            ->get('/geo-proxy?SERVICE=WMS&REQUEST=GetMap&WIDTH=20000&HEIGHT=20000&BBOX=0,0,1,1')
            ->assertStatus(413);
    }

    public function test_getmap_lebih_dari_4096_tidak_menembus_upstream(): void
    {
        Http::fake(['geoserver-uji.local/*' => Http::response('', 200)]);

        $this->actingAs($this->user)
            ->get('/geo-proxy?SERVICE=WMS&REQUEST=GetMap&WIDTH=20000&HEIGHT=20000&BBOX=0,0,1,1');

        Http::assertNothingSent();
    }

    public function test_parameter_tidak_dikenal_dibuang(): void
    {
        Http::fake([
            'geoserver-uji.local/*' => Http::response('{"type":"FeatureCollection","features":[]}', 200),
        ]);

        $this->actingAs($this->user)
            ->get('/geo-proxy?service=WFS&request=GetFeature&typeName=x'
                .'&format_options=callback:alert(1)&outputFormat=text/javascript');

        Http::assertSent(function ($request) {
            $data = $request->data();
            $fmt = $data['outputformat'] ?? $data['outputFormat'] ?? null;

            return $fmt === 'application/json'
                && ! isset($data['format_options'])
                && str_contains($request->url(), 'geoserver-uji.local/ows');
        });
    }

    public function test_cql_filter_kutip_diescape(): void
    {
        Http::fake([
            'geoserver-uji.local/*' => Http::response('', 200),
        ]);

        $this->actingAs($this->user)
            ->get('/geo-proxy?SERVICE=WMS&REQUEST=GetMap&BBOX=0,0,1,1&cql_filter='.rawurlencode("nama='x'"));

        Http::assertSent(function ($request) {
            $data = $request->data();

            return ($data['cql_filter'] ?? null) === "nama=''x''";
        });
    }

    public function test_error_upstream_tidak_bocor_ke_klien(): void
    {
        Http::fake([
            'geoserver-uji.local/*' => Http::response('internal secret details', 500),
        ]);

        $response = $this->actingAs($this->user)
            ->get('/geo-proxy?SERVICE=WMS&REQUEST=GetMap&BBOX=0,0,1,1');

        $response->assertStatus(502);
        $this->assertStringNotContainsString('secret', $response->getContent());
    }

    public function test_exception_upstream_menghasilkan_502_bukan_detail(): void
    {
        Http::fake(function () {
            throw new \Exception('Connection refused to 36.93.220.245:8080');
        });

        $response = $this->actingAs($this->user)
            ->get('/geo-proxy?SERVICE=WMS&REQUEST=GetMap&BBOX=0,0,1,1');

        $response->assertStatus(502);
        $this->assertStringNotContainsString('36.93.220.245', $response->getContent());
    }
}
