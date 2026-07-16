from typing import TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse[T](BaseModel):
    data: list[T]
    total: int
    page: int
    page_size: int
