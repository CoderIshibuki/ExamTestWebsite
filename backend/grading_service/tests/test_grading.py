from services.grading_engine import GradingEngine

def test_grading_engine_all_correct():
    questions = [
        {"_id": "q1", "type": "multiple_choice", "correct_answer": "A", "point_possible": 1.0},
        {"_id": "q2", "type": "true_false", "correct_answer": "True", "point_possible": 2.0}
    ]
    answers = {"q1": "A", "q2": "True"}
    engine = GradingEngine(questions)
    result = engine.grade(answers)
    
    assert result["score"] == 3.0
    assert result["total_possible"] == 3.0
    assert result["percentage"] == 100.0
    assert result["correct_count"] == 2
    assert result["incorrect_count"] == 0
    assert len(result["question_results"]) == 2

def test_grading_engine_partial_correct():
    questions = [
        {"_id": "q1", "type": "multiple_choice", "correct_answer": "A", "point_possible": 1.0},
        {"_id": "q2", "type": "true_false", "correct_answer": "True", "point_possible": 2.0}
    ]
    answers = {"q1": "A", "q2": "False"}
    engine = GradingEngine(questions)
    result = engine.grade(answers)
    
    assert result["score"] == 1.0
    assert result["total_possible"] == 3.0
    assert result["percentage"] == (1.0/3.0) * 100
    assert result["correct_count"] == 1
    assert result["incorrect_count"] == 1
    
def test_grading_engine_index_answers():
    questions = [
        {"_id": "q1", "type": "multiple_choice", "correct_answer": "A", "point_possible": 1.0},
    ]
    answers = {"0": "A"} # submit by index instead of _id
    engine = GradingEngine(questions)
    result = engine.grade(answers)
    
    assert result["score"] == 1.0
    assert result["percentage"] == 100.0
    assert result["correct_count"] == 1
