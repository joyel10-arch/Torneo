import subprocess
import time
import json
import base64
import requests
import websocket
import os

def capture_screens():
    os.makedirs("d:/Torneo/screenshots", exist_ok=True)
    
    # 1. Get auth token
    res = requests.post('http://localhost:8000/api/auth/login', json={'email':'organizer@torneo.app','password':'Org@123'})
    auth_data = res.json()
    token = auth_data['access_token']
    user_json = json.dumps(auth_data['user'])
    
    chrome_cmd = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--disable-gpu",
        "--window-size=1440,900",
        "--user-data-dir=d:/Torneo/tmp/chrome_capture_profile",
        "about:blank"
    ]
    proc = subprocess.Popen(chrome_cmd)
    time.sleep(2.5)
    
    try:
        # Find page target
        targets = requests.get('http://localhost:9222/json/list').json()
        page_target = next(t for t in targets if t.get('type') == 'page')
        ws_url = page_target['webSocketDebuggerUrl']
        print(f"Connecting to page WS: {ws_url}")
        
        ws = websocket.create_connection(ws_url, timeout=20)
        msg_id = 0
        
        def send_msg(method, params=None):
            nonlocal msg_id
            msg_id += 1
            payload = {"id": msg_id, "method": method}
            if params:
                payload["params"] = params
            ws.send(json.dumps(payload))
            while True:
                recv_str = ws.recv()
                recv = json.loads(recv_str)
                if recv.get("id") == msg_id:
                    return recv
        
        send_msg("Page.enable")
        send_msg("Runtime.enable")
        
        # Navigate to login to initialize origin domain
        print("Initializing domain origin...")
        send_msg("Page.navigate", {"url": "http://localhost:5173/login"})
        time.sleep(2)
        
        # Inject localStorage
        inject_js = f"""
        localStorage.setItem('torneo_token', '{token}');
        localStorage.setItem('torneo_user', JSON.stringify({user_json}));
        """
        send_msg("Runtime.evaluate", {"expression": inject_js})
        time.sleep(1)
        
        pages = [
            ("dashboard", "http://localhost:5173/"),
            ("tournaments", "http://localhost:5173/tournaments"),
            ("tournament_detail", "http://localhost:5173/tournaments/d0efbe9b-894c-44e1-b1b6-5594e6d73e33"),
            ("standings", "http://localhost:5173/standings"),
            ("dsa_lab", "http://localhost:5173/dsa-lab"),
            ("teams", "http://localhost:5173/teams"),
            ("venues", "http://localhost:5173/venues"),
        ]
        
        for name, url in pages:
            print(f"Capturing {name} from {url}...")
            send_msg("Page.navigate", {"url": url})
            time.sleep(2.5)
            
            # If dsa_lab, trigger sort or interact if needed
            if name == "dsa_lab":
                click_js = """
                const btn = document.querySelector('button.btn-primary');
                if (btn) btn.click();
                """
                send_msg("Runtime.evaluate", {"expression": click_js})
                time.sleep(1.5)

            shot = send_msg("Page.captureScreenshot", {"format": "png"})
            if "result" in shot and "data" in shot["result"]:
                img_b64 = shot["result"]["data"]
                out_path = f"d:/Torneo/screenshots/{name}.png"
                with open(out_path, "wb") as f:
                    f.write(base64.b64decode(img_b64))
                print(f"[OK] Saved {out_path} ({len(img_b64)} bytes base64)")
            else:
                print(f"[FAIL] Failed capturing {name}: {shot}")
            
        ws.close()
    finally:
        proc.terminate()

if __name__ == "__main__":
    capture_screens()
