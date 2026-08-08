import random
from locust import HttpUser, task, between, events
from urllib3.exceptions import InsecureRequestWarning
import urllib3
urllib3.disable_warnings(InsecureRequestWarning)

shared_token = None

@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    # Register a single test user before load test begins
    import requests
    url = f"{environment.host}/api/auth/register"
    try:
        requests.post(url, json={
            "username": "loadtest",
            "email": "loadtest@example.com",
            "password": "loadtest",
            "full_name": "Load Test",
            "role": "student"
        }, verify=False)
    except Exception:
        pass
        
    # Login to get the shared token
    try:
        resp = requests.post(
            f"{environment.host}/api/auth/login",
            data={"username": "loadtest", "password": "loadtest"},
            headers={"X-Forwarded-For": "127.0.0.99"},
            verify=False
        )
        if resp.status_code == 200:
            data = resp.json()
            global shared_token
            global shared_user_id
            shared_token = data.get("access_token")
            if shared_token:
                import jwt
                decoded = jwt.decode(shared_token, options={"verify_signature": False})
                shared_user_id = decoded.get("sub")
    except Exception:
        pass
        
    global shared_exam_id
    import uuid
    shared_exam_id = str(uuid.uuid4())

class ExamUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        if shared_token:
            self.client.headers.update({"Authorization": f"Bearer {shared_token}"})
        self.user_id = globals().get("shared_user_id", "test_user_1")
        self.exam_id = globals().get("shared_exam_id")
            
    @task(3)
    def get_exams_and_questions(self):
        # Generate random IP to bypass rate limit if needed (though these are GET requests)
        fake_ip = f"10.0.{random.randint(1, 255)}.{random.randint(1, 255)}"
        self.client.headers.update({"X-Forwarded-For": fake_ip})
        
        self.client.get("/api/v1/exams", verify=False)
        self.client.get("/api/v1/questions", verify=False)

    @task(1)
    def submit_mock_exam(self):
        fake_ip = f"10.0.{random.randint(1, 255)}.{random.randint(1, 255)}"
        self.client.headers.update({"X-Forwarded-For": fake_ip})
        
        payload = {
            "exam_id": getattr(self, 'exam_id', '00000000-0000-0000-0000-000000000000'),
            "user_id": getattr(self, 'user_id', 'test_user_1'),
            "answers": {"1": "A", "2": "B"}
        }
        self.client.post("/api/v1/grading/submit", json=payload, verify=False)
