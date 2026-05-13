from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase
from modules.warehouses.repository import WarehouseRepository
from modules.warehouses.schemas import WarehouseCreate, WarehouseResponse


class WarehouseService:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.repository = WarehouseRepository(database)
        self.db = database

    async def create_warehouse(self, data: WarehouseCreate) -> WarehouseResponse:
        warehouse_id = await self.repository.create(data.model_dump(mode="json"))
        warehouse = await self.repository.find_by_id(warehouse_id)
        if warehouse is None:
            raise ValueError("Warehouse not found")
        return WarehouseResponse.model_validate(warehouse)

    async def get_all_warehouses(self) -> list[WarehouseResponse]:
        warehouses = await self.repository.find_all()
        return [WarehouseResponse.model_validate(warehouse) for warehouse in warehouses]

    async def get_warehouse(self, warehouse_id: str) -> WarehouseResponse:
        warehouse = await self.repository.find_by_id(warehouse_id)
        if warehouse is None:
            raise ValueError("Warehouse not found")
        return WarehouseResponse.model_validate(warehouse)

    async def delete_warehouse(self, warehouse_id: str) -> None:
        try:
            oid = ObjectId(warehouse_id)
        except InvalidId:
            raise ValueError("Invalid warehouse ID")

        count = await self.db["products"].count_documents({"warehouse_id": warehouse_id})
        if count > 0:
            raise ValueError(f"El almacén tiene {count} producto(s) asignado(s). Reasígnalos antes de borrarlo.")

        deleted = await self.repository.delete_by_id(warehouse_id)
        if not deleted:
            raise ValueError("Warehouse not found")
