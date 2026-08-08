import json
import urllib.request
import urllib.error
import urllib.parse

def request(url, method="GET", data=None, headers=None):
    if headers is None: headers = {}
    if data is not None:
        if isinstance(data, dict) and headers.get('Content-Type') == 'application/json':
            data = json.dumps(data).encode('utf-8')
        elif isinstance(data, dict) and headers.get('Content-Type') == 'application/x-www-form-urlencoded':
            data = urllib.parse.urlencode(data).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return 0, str(e)

print("Test 2: Health")
print(request("http://localhost:8000/health"))

print("Test 3: Nginx Health")
print(request("http://localhost/api/auth/health"))

print("Test 4: Docs")
print(request("http://localhost/api/auth/docs"))

print("Test 5: Register")
res_reg = request("http://localhost/api/auth/register", method="POST", data={"username": "testuser3", "email": "test3@test.com", "password": "pass", "full_name": "Test"}, headers={"Content-Type": "application/json"})
print(res_reg)

print("Test 6: Login")
res_log = request("http://localhost/api/auth/login", method="POST", data={"username": "testuser3", "password": "pass"}, headers={"Content-Type": "application/x-www-form-urlencoded"})
print(res_log)

if res_log[0] == 200:
    data = json.loads(res_log[1])
    token = data["access_token"]
    refresh = data.get("refresh_token")
    
    print("Test 7: Get Me")
    print(request("http://localhost/api/auth/me", headers={"Authorization": f"Bearer {token}"}))
    
    if refresh:
        print("Test 8: Refresh")
        print(request("http://localhost/api/auth/refresh", method="POST", data={"refresh_token": refresh}, headers={"Content-Type": "application/json"}))
