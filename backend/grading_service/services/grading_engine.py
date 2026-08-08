from typing import List, Dict, Any

class GradingEngine:
    def __init__(self, questions: List[Dict[str, Any]]):
        self.questions = questions
        # In a real scenario, the question ID could be 'id' or '_id'
        self.question_map = {q.get("_id") or q.get("id"): q for q in questions}
    
    def grade(self, answers: Dict[str, str]) -> dict:
        """
        answers: { "0": "A" } or { "question_id": "A" }
        """
        correct_count = 0
        total_possible = len(self.questions)
        question_results = []
        
        for idx, question in enumerate(self.questions):
            # User might submit by index (string "0") or by question_id
            # Let's support index first as requested in the plan
            user_answer = answers.get(str(idx))
            if not user_answer:
                # Fallback to question_id
                question_id = question.get("_id") or question.get("id")
                user_answer = answers.get(str(question_id))
            
            question_id = question.get("_id") or question.get("id")
            correct_answer = question.get("correct_answer")
            point_possible = question.get("point_possible", 1.0)
            
            # Multiple choice / True/False
            if question.get("type") in ["multiple_choice", "true_false"]:
                is_correct = user_answer == correct_answer
                point_earned = point_possible if is_correct else 0.0
                
                if is_correct:
                    correct_count += 1
            else:
                # Essay - will be graded manually later
                point_earned = 0.0
                is_correct = False
            
            question_results.append({
                "question_id": str(question_id),
                "user_answer": user_answer,
                "is_correct": is_correct,
                "point_earned": point_earned,
                "point_possible": point_possible
            })
        
        total_earned = sum(qr["point_earned"] for qr in question_results)
        total_possible = sum(qr["point_possible"] for qr in question_results)
        percentage = (total_earned / total_possible * 100) if total_possible > 0 else 0
        
        return {
            "score": total_earned,
            "total_possible": total_possible,
            "percentage": percentage,
            "correct_count": correct_count,
            "incorrect_count": len(question_results) - correct_count,
            "question_results": question_results
        }
