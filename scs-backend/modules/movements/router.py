from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from db.mongodb import get_database
from modules.movements.schemas import MovementCreate, MovementResponse
from modules.movements.service import MovementService

router = APIRouter(tags=["movements"])


def get_movement_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> MovementService:
    return MovementService(db)


@router.post("", response_model=MovementResponse, status_code=status.HTTP_201_CREATED)
async def create_movement(
    data: MovementCreate,
    user_id: str = "system",
    service: MovementService = Depends(get_movement_service),
) -> MovementResponse:
    try:
        return await service.create_movement(data, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{product_id}", response_model=list[MovementResponse])
async def get_movements_by_product(
    product_id: str,
    service: MovementService = Depends(get_movement_service),
) -> list[MovementResponse]:
    return await service.get_movements_by_product(product_id)
