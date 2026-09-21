-- GeoVision Enterprise 3D Cadastre Schema
-- Target Database: PostgreSQL 16+ with PostGIS 3.4+ & SFCGAL 3D geometry extension
-- Implements OGC Land Administration Domain Model (LADM ISO 19152) 3D Profile

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_sfcgal; -- 3D volume, polyhedral surface, collision checks

-- 2D Primary Land Parcel (Cadastral Lot)
CREATE TABLE IF NOT EXISTS cadastre_parcel_2d (
    parcel_id VARCHAR(5) PRIMARY KEY,
    ulpin_2d VARCHAR(24) NOT NULL UNIQUE,
    survey_number VARCHAR(64) NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    city_code VARCHAR(3) NOT NULL,
    district_name VARCHAR(128) NOT NULL,
    area_sqm NUMERIC(12, 2) NOT NULL,
    land_use VARCHAR(32) NOT NULL CHECK (land_use IN ('Residential', 'Commercial', 'Mixed', 'Industrial', 'Institutional')),
    source_system VARCHAR(32) NOT NULL CHECK (source_system IN ('DILRMP', 'BhuNaksha', 'SVAMITVA', 'Manual')),
    boundary GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parcel_boundary ON cadastre_parcel_2d USING GIST (boundary);

-- 3D Building Volume Envelope
CREATE TABLE IF NOT EXISTS cadastre_building_3d (
    building_id VARCHAR(3) NOT NULL,
    parcel_id VARCHAR(5) NOT NULL REFERENCES cadastre_parcel_2d(parcel_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    base_elevation_m NUMERIC(8, 2) NOT NULL,
    height_m NUMERIC(8, 2) NOT NULL,
    floors_above INT NOT NULL CHECK (floors_above >= 0),
    floors_below INT NOT NULL DEFAULT 0,
    approved_floors INT NOT NULL,
    year_built INT,
    extraction_confidence NUMERIC(4, 3) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'Verified' CHECK (status IN ('Verified', 'Pending', 'Flagged')),
    footprint GEOMETRY(Polygon, 4326) NOT NULL,
    envelope_solid GEOMETRY(PolyhedralSurfaceZ, 4326),
    PRIMARY KEY (parcel_id, building_id)
);

-- Floor Slices
CREATE TABLE IF NOT EXISTS cadastre_floor_3d (
    floor_id VARCHAR(32) PRIMARY KEY,
    parcel_id VARCHAR(5) NOT NULL,
    building_id VARCHAR(3) NOT NULL,
    code VARCHAR(8) NOT NULL,
    label VARCHAR(128) NOT NULL,
    base_height_m NUMERIC(8, 2) NOT NULL,
    height_m NUMERIC(8, 2) NOT NULL,
    area_sqm NUMERIC(10, 2) NOT NULL,
    usage VARCHAR(32) NOT NULL,
    unit_count INT NOT NULL DEFAULT 1,
    segmentation_confidence NUMERIC(4, 3) NOT NULL,
    ownership_status VARCHAR(32) NOT NULL,
    FOREIGN KEY (parcel_id, building_id) REFERENCES cadastre_building_3d(parcel_id, building_id)
);

-- Vertical Parcel Units (The 3D Cadastral Prism)
CREATE TABLE IF NOT EXISTS cadastre_unit_3d (
    unit_id VARCHAR(16) NOT NULL,
    floor_id VARCHAR(32) NOT NULL REFERENCES cadastre_floor_3d(floor_id),
    flat_number VARCHAR(32) NOT NULL,
    ulpin_3d VARCHAR(36) PRIMARY KEY, -- Ex: MH-MUM-98213-B04-F12-U302
    owner_name VARCHAR(255) NOT NULL,
    owner_id_masked VARCHAR(64) NOT NULL,
    built_up_area_sqm NUMERIC(10, 2) NOT NULL,
    carpet_area_sqm NUMERIC(10, 2) NOT NULL,
    parking_slot VARCHAR(32),
    storage_locker VARCHAR(32),
    tax_status VARCHAR(16) NOT NULL CHECK (tax_status IN ('Paid', 'Due', 'Overdue')),
    registration_date DATE NOT NULL,
    verification_status VARCHAR(24) NOT NULL CHECK (verification_status IN ('Verified', 'Pending Approval', 'Rejected')),
    approved_by VARCHAR(255),
    check_digits VARCHAR(2) NOT NULL,
    prism_min_height_m NUMERIC(8, 2) NOT NULL,
    prism_max_height_m NUMERIC(8, 2) NOT NULL,
    prism_volume_m3 NUMERIC(12, 2) NOT NULL
);

-- Spatial query checking 3D volumetric overlap using PostGIS 3D intersection:
-- SELECT a.ulpin_3d, b.ulpin_3d FROM cadastre_unit_3d a, cadastre_unit_3d b
-- WHERE a.ulpin_3d < b.ulpin_3d AND ST_3DIntersects(a.envelope_solid, b.envelope_solid);
