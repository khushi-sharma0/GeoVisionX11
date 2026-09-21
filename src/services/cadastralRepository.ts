// Repository interface and In-Memory adapter for GeoVision
// Enables seamless future replacement with PostgreSQL + PostGIS REST client

import { Parcel, Building, Floor, Unit, VerticalParcel } from '../domain/types';
import { generateSeedData, SeedDataResult } from '../data/seed';

export interface CadastralRepository {
  getParcels(): Promise<Parcel[]>;
  getParcelById(id: string): Promise<Parcel | undefined>;
  getBuildings(parcelId?: string): Promise<Building[]>;
  getBuildingById(buildingId: string): Promise<Building | undefined>;
  getFloors(buildingId?: string): Promise<Floor[]>;
  getFloorById(floorId: string): Promise<Floor | undefined>;
  getUnits(floorId?: string): Promise<Unit[]>;
  getUnitById(unitId: string): Promise<Unit | undefined>;
  getUnitByUlpin3d(ulpin3d: string): Promise<Unit | undefined>;
  getVerticalParcels(): Promise<VerticalParcel[]>;
  saveUnit(unit: Unit): Promise<Unit>;
  updateUnitVerification(ulpin3d: string, status: Unit['verificationStatus'], approvedBy?: string): Promise<Unit>;
  addParcel(parcel: Parcel): Promise<Parcel>;
  addBuilding(building: Building): Promise<Building>;
  addDispute(unitId: string, disputeId: string): Promise<void>;
  resetToSeed(): void;
}

class InMemoryCadastralRepository implements CadastralRepository {
  private data: SeedDataResult;

  constructor() {
    this.data = generateSeedData();
  }

  resetToSeed(): void {
    this.data = generateSeedData();
  }

  async getParcels(): Promise<Parcel[]> {
    return [...this.data.parcels];
  }

  async getParcelById(id: string): Promise<Parcel | undefined> {
    return this.data.parcels.find((p) => p.parcelId === id);
  }

  async getBuildings(parcelId?: string): Promise<Building[]> {
    if (parcelId) {
      return this.data.buildings.filter((b) => b.parcelId === parcelId);
    }
    return [...this.data.buildings];
  }

  async getBuildingById(buildingId: string): Promise<Building | undefined> {
    return this.data.buildings.find((b) => b.buildingId === buildingId);
  }

  async getFloors(buildingId?: string): Promise<Floor[]> {
    if (buildingId) {
      return this.data.floors.filter((f) => f.buildingId === buildingId);
    }
    return [...this.data.floors];
  }

  async getFloorById(floorId: string): Promise<Floor | undefined> {
    return this.data.floors.find((f) => f.floorId === floorId);
  }

  async getUnits(floorId?: string): Promise<Unit[]> {
    if (floorId) {
      return this.data.units.filter((u) => u.floorId === floorId);
    }
    return [...this.data.units];
  }

  async getUnitById(unitId: string): Promise<Unit | undefined> {
    return this.data.units.find((u) => u.unitId === unitId);
  }

  async getUnitByUlpin3d(ulpin3d: string): Promise<Unit | undefined> {
    return this.data.units.find((u) => u.ulpin3d.toLowerCase() === ulpin3d.toLowerCase().trim());
  }

  async getVerticalParcels(): Promise<VerticalParcel[]> {
    return [...this.data.verticalParcels];
  }

  async saveUnit(unit: Unit): Promise<Unit> {
    const idx = this.data.units.findIndex((u) => u.unitId === unit.unitId || u.ulpin3d === unit.ulpin3d);
    if (idx >= 0) {
      this.data.units[idx] = { ...unit };
    } else {
      this.data.units.push({ ...unit });
    }
    return { ...unit };
  }

  async updateUnitVerification(
    ulpin3d: string,
    status: Unit['verificationStatus'],
    approvedBy?: string
  ): Promise<Unit> {
    const unit = this.data.units.find((u) => u.ulpin3d === ulpin3d);
    if (!unit) {
      throw new Error(`Unit with 3D ULPIN ${ulpin3d} not found.`);
    }
    unit.verificationStatus = status;
    if (approvedBy) {
      unit.approvedBy = approvedBy;
    }
    return { ...unit };
  }

  async addParcel(parcel: Parcel): Promise<Parcel> {
    this.data.parcels.push(parcel);
    return parcel;
  }

  async addBuilding(building: Building): Promise<Building> {
    this.data.buildings.push(building);
    return building;
  }

  async addDispute(unitId: string, disputeId: string): Promise<void> {
    const unit = this.data.units.find((u) => u.unitId === unitId);
    if (unit) {
      if (!unit.disputeIds.includes(disputeId)) {
        unit.disputeIds.push(disputeId);
      }
    }
  }
}

export const cadastralRepo: CadastralRepository = new InMemoryCadastralRepository();
