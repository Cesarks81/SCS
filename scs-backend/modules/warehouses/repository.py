from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase


class WarehouseRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["warehouses"]

    @staticmethod
    def _serialize(document: dict | None) -> dict | None:
        if not document:
            return None
        document["id"] = str(document.pop("_id"))
        return document

    async def create(self, warehouse: dict) -> str:
        result = await self.collection.insert_one(warehouse)
        return str(result.inserted_id)

    async def find_all(self) -> list[dict]:
        documents = await self.collection.find({}).to_list(length=None)
        return [self._serialize(document) for document in documents if document]

    async def find_by_id(self, warehouse_id: str) -> dict | None:
        try:
            object_id = ObjectId(warehouse_id)
        except InvalidId:
            return None

        document = await self.collection.find_one({"_id": object_id})
        return self._serialize(document)

    async def delete_by_id(self, warehouse_id: str) -> bool:
        try:
            object_id = ObjectId(warehouse_id)
        except InvalidId:
            return False

        result = await self.collection.delete_one({"_id": object_id})
        return result.deleted_count == 1
