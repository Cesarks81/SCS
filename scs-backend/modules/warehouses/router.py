from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from db.mongodb import get_database
from modules.warehouses.schemas import WarehouseCreate, WarehouseResponse
from modules.warehouses.service import WarehouseService

router = APIRouter(tags=["warehouses"])


def get_warehouse_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> WarehouseService:
    return WarehouseService(db)


@router.post("", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
async def create_warehouse(
    data: WarehouseCreate,
    service: WarehouseService = Depends(get_warehouse_service),
) -> WarehouseResponse:
    return await service.create_warehouse(data)


@router.get("", response_model=list[WarehouseResponse])
async def get_all_warehouses(
    service: WarehouseService = Depends(get_warehouse_service),
) -> list[WarehouseResponse]:
    return await service.get_all_warehouses()


@router.get("/{warehouse_id}", response_model=WarehouseResponse)
async def get_warehouse(
    warehouse_id: str,
    service: WarehouseService = Depends(get_warehouse_service),
) -> WarehouseResponse:
    try:
        return await service.get_warehouse(warehouse_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found") from exc


@router.delete("/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_warehouse(
    warehouse_id: str,
    service: WarehouseService = Depends(get_warehouse_service),
) -> None:
    try:
        await service.delete_warehouse(warehouse_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
