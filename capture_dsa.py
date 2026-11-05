import subprocess
import time
import json
import base64
import requests
import websocket
import os

def capture_dsa_tabs():
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
        targets = requests.get('http://localhost:9222/json/list').json()
        page_target = next(t for t in targets if t.get('type') == 'page')
        ws = websocket.create_connection(page_target['webSocketDebuggerUrl'], timeout=20)
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
        
        send_msg("Page.navigate", {"url": "http://localhost:5173/login"})
        time.sleep(2)
        
        inject_js = f"""
        localStorage.setItem('torneo_token', '{token}');
        localStorage.setItem('torneo_user', JSON.stringify({user_json}));
        """
        send_msg("Runtime.evaluate", {"expression": inject_js})
        time.sleep(1)
        
        send_msg("Page.navigate", {"url": "http://localhost:5173/dsa-lab"})
        time.sleep(2.5)
        
        tabs = [
            ("dsa_binary", "Binary Search"),
            ("dsa_tree", "Tournament Tree"),
            ("dsa_graph", "Match Graph"),
        ]
        
        for name, label in tabs:
            click_tab_js = f"""
            const btns = Array.from(document.querySelectorAll('button'));
            const targetBtn = btns.find(b => b.textContent.includes('{label}'));
            if (targetBtn) targetBtn.click();
            """
            send_msg("Runtime.evaluate", {"expression": click_tab_js})
            time.sleep(1.5)
            
            # Click primary action if present
            action_js = """
            const actionBtn = document.querySelector('button.btn-primary');
            if (actionBtn) actionBtn.click();
            """
            send_msg("Runtime.evaluate", {"expression": action_js})
            time.sleep(1.5)
            
            shot = send_msg("Page.captureScreenshot", {"format": "png"})
            if "result" in shot and "data" in shot["result"]:
                img_b64 = shot["result"]["data"]
                out_path = f"d:/Torneo/screenshots/{name}.png"
                with open(out_path, "wb") as f:
                    f.write(base64.b64decode(img_b64))
                print(f"[OK] Saved {out_path}")
                
        ws.close()
    finally:
        proc.terminate()

if __name__ == "__main__":
    capture_dsa_tabs()
