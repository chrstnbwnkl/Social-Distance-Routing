const { query} = require('./config/database');
const {config_pg} = require('./config/pg_config');

function routeQuery(start, end) {
    const query = `
    SELECT *, st_transform(geom_way, ${config_pg.output_srid}) as geom, st_asgeojson(st_transform(geom_way, ${config_pg.output_srid})) geojson, st_astext(st_transform(geom_way, ${config_pg.output_srid})) wkt FROM pgr_dijkstra(
        'SELECT id, source, target, cost FROM ${config_pg.table}', 
        (SELECT id FROM ${config_pg.vertices_table} ORDER BY st_distance(the_geom, st_setsrid(st_makepoint(${start}), ${config_pg.input_srid})) LIMIT 1),
        (SELECT id FROM ${config_pg.vertices_table} ORDER BY st_distance(the_geom, st_setsrid(st_makepoint(${end}), ${config_pg.input_srid})) LIMIT 1),
        false) as dj, ${config_pg.table} as ln where dj.edge=ln."id";`;
    return query;
}

function route(start, end) {
    return new Promise((resolve, reject) => {
        query(routeQuery(start, end), (err, res) => {
            if (err) {
                reject('query error', err);
                console.log(err);
                return;
            }
            resolve({
                route: res.rows
            });
        });
    });
}

module.exports = {
    route
};
