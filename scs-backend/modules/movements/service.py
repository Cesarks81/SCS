from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase

from modules.movements.repository import MovementRepository
from modules.movements.schemas import MovementCreate, MovementResponse, MovementType


class MovementService:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.repository = MovementRepository(database)
        self.db = database

    async def create_movement(self, data: MovementCreate, user_id: str) -> MovementResponse:
        try:
            product_oid = ObjectId(data.product_id)
        except InvalidId:
            raise ValueError("Invalid product ID")

        if data.type == MovementType.OUT:
            product = await self.db["products"].find_one({"_id": product_oid})
            if product is None:
                raise ValueError("Product not found")
            available = product.get("current_stock", 0)
            if available < data.quantity:
                raise ValueError(f"Stock insuficiente ({available} disponibles)")

        payload = data.model_dump(mode="json")
        payload["user_id"] = user_id
        payload["timestamp"] = datetime.now(timezone.utc)

        movement_id = await self.repository.create(payload)

        increment = data.quantity if data.type == MovementType.IN else -data.quantity
        await self.db["products"].update_one(
            {"_id": product_oid},
            {"$inc": {"current_stock": increment}},
        )

        created = await self.repository.collection.find_one({"_id": ObjectId(movement_id)})
        if created is None:
            raise ValueError("Movement not found")

        created["id"] = str(created.pop("_id"))
        return MovementResponse.model_validate(created)

    async def get_movements_by_product(self, product_id: str) -> list[MovementResponse]:
        movements = await self.repository.find_by_product_id(product_id)
        return [MovementResponse.model_validate(movement) for movement in movements]
