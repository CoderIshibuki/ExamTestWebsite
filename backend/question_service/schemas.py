from typing import List, Optional, Union
from pydantic import BaseModel, Field
from utils.validators import PyObjectId
from models import QuestionContent, Option, QuestionMetadata, CategoryModel, QuestionModel

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryResponse(CategoryModel):
    pass

class QuestionCreate(BaseModel):
    content: QuestionContent
    type: str
    options: List[Option] = []
    correct_answer: Union[str, List[str]]
    explanation: Optional[str] = None
    metadata: QuestionMetadata
    category_id: Optional[str] = None

class QuestionUpdate(BaseModel):
    content: Optional[QuestionContent] = None
    type: Optional[str] = None
    options: Optional[List[Option]] = None
    correct_answer: Optional[Union[str, List[str]]] = None
    explanation: Optional[str] = None
    metadata: Optional[QuestionMetadata] = None
    is_active: Optional[bool] = None
    category_id: Optional[str] = None

class QuestionResponse(QuestionModel):
    pass

class PaginatedQuestionResponse(BaseModel):
    total: int
    page: int
    size: int
    items: List[QuestionResponse]

class PaginatedCategoryResponse(BaseModel):
    total: int
    page: int
    size: int
    items: List[CategoryResponse]
