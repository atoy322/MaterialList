import socket
import select
import os
import json


CWD = os.getcwd() + '/'

FILES = 'server.data'
MATERIAL_DATABASE = FILES +'/'+ 'materials.json'

WHITE = (1, 1, 1)
RED = (1, 0, 0)
GREEN = (0, 1, 0)
BLUE = (0, 0, 1)
YELLOW = (1, 1, 0)


def file_to_bin(path):
    try:
        with open(path, 'rb') as f:
            data = f.read()
    except:
        data = None
    return data
    
def cprint(color, msg):
    print(msg)


def add_json(dictionaly):
    with open(MATERIAL_DATABASE, 'r', encoding='utf8') as f:
        data = json.load(f)
        
    data.append(dictionaly)
    
    with open(MATERIAL_DATABASE, 'w', encoding='utf8') as f:
        json.dump(data, f, indent=4, separators=(',', ': '))
        f.flush()
    
    return json.dumps(data)

def rm_json(col):
    with open(MATERIAL_DATABASE, 'r', encoding='utf8') as f:
        data = json.load(f)

    try:
        data.pop(col)
    except:
        pass

    with open(MATERIAL_DATABASE, 'w', encoding='utf8') as f:
        json.dump(data, f, indent=4, separators=(',', ': '))
        f.flush()
    
    return json.dumps(data)

def toggle_json(col):
    with open(MATERIAL_DATABASE, 'r', encoding='utf8') as f:
        data = json.load(f)

    if data[col]['bought'] == 'true':
        data[col]['bought'] = 'false'
    else:
        data[col]['bought'] = 'true'

    with open(MATERIAL_DATABASE, 'w', encoding='utf8') as f:
        json.dump(data, f, indent=4, separators=(',', ': '))
        f.flush()
    
    return json.dumps(data)



class SelectServer:
    def __init__(self, *args, **kwargs):
        self.server_socket = socket.socket(*args, **kwargs)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.read_waiters = {}
        self.write_waiters = {}
        
    def serve_forever(self):
        self.read_waiters[self.server_socket] = self.accept
        
        while True:
            readables, writables, _ = select.select(
                    self.read_waiters.keys(),
                    self.write_waiters.keys(),
                    []
                )
            
            try:
                for readable in readables:
                    func = self.read_waiters[readable]
                    func(readable)
                    self.read_waiters.pop(readable)
                
                for writable in writables:
                    func, arg = self.write_waiters[writable]
                    func(writable, arg)
                    self.write_waiters.pop(writable)
            except Exception as e:
                print(e)
        
    def bind(self, address):
        self.server_socket.bind(address)
        self.server_socket.listen(socket.SOMAXCONN)
        cprint(YELLOW, f'Listening on {address[0]} port {address[1]}')
        
    def accept(self, sock):
        conn, addr = sock.accept()
        self.read_waiters[conn] = self.recv
    
    def send(self, sock, data):
        sock.sendall(data)
        self.read_waiters[self.server_socket] = self.accept
        sock.close()
        
    def response(self, sock, status, options={}):
        response_message = ''
        
        response_message += f'HTTP/1.0 {str(status[0])} {status[1]}\r\n'
        
        for key in options.keys():
            val = str(options[key])
            response_message += f'{key}: {val}\r\n'
        sock.sendall((response_message+'\r\n').encode())
    
    def recv(self, sock):
        header = sock.recv(2048)
        try:
            header = header.decode()
        except Exception as e:
            sock.close()
            self.read_waiters[self.server_socket] = self.accept
            print(e)
            print(header)
            return

        if not header:
            self.read_waiters[self.server_socket] = self.accept
            return
        cmd, path = self.parse_header(header)
        
        if cmd == 'GET':
            data = file_to_bin(path)
            if data:
                cprint(GREEN, f'GET:[200]:{path.split("/")[-1]}')
                self.response(sock, (200, 'OK'), {'Content-Length': len(data)})
                self.write_waiters[sock] = (self.send, data)
            else:
                cprint(RED, f'GET:[404]:{path.split("/")[-1]}')
                self.response(sock, (404, 'NOT FOUND'))
                self.read_waiters[self.server_socket] = self.accept
                sock.close()
        
        elif cmd == 'POST':
            endpoint = path.split("/")[-1]
            if not header.split('\r\n\r\n')[-1]:
                data = sock.recv(2048).decode()
                header += data
            else:
                data = header.split('\r\n\r\n')[-1]
            
            if endpoint == "AddMaterial":
                cprint(GREEN, f'POST:[200]:{endpoint}')
                dic = dict([i.split('|#|') for i in data.split("|&|")])
                dic['bought'] = 'false'
                print(dic)

                if "" in dic.values():
                    with open(MATERIAL_DATABASE, "rb") as f:
                        jsn = f.read()
                else:
                    jsn = add_json(dic).encode()

                self.response(sock, (200, 'OK'))
                self.write_waiters[sock] = (self.send, jsn)

            elif endpoint == "RemoveMaterial":
                cprint(GREEN, f'POST:[200]:{endpoint}')
                dic = dict([i.split("=") for i in data.split("&")])
                jsn = rm_json(int(dic["col"])).encode()
                self.response(sock, (200, 'OK'))
                self.write_waiters[sock] = (self.send, jsn)
                
            elif endpoint == "ToggleMaterial":
                cprint(GREEN, f'POST:[200]:{endpoint}')
                dic = dict([i.split("=") for i in data.split("&")])
                jsn = toggle_json(int(dic["col"])).encode()
                self.response(sock, (200, 'OK'))
                self.write_waiters[sock] = (self.send, jsn)

            else:
                cprint(RED, f'POST:[404]:{endpoint}')
                self.response(sock, (404, 'NOT FOUND'))
                self.read_waiters[self.server_socket] = self.accept
                sock.close()

        else:
            sock.close()
            self.read_waiters[self.server_socket] = self.accept

    def parse_header(self, header_str):
        lines = header_str.split('\r\n')
        cmd, path, version = lines[0].split()
        
        if path == '/':
            path = '/index.html'
            print(header_str)
        
        path = CWD + FILES + path
        
        return cmd, path


server = SelectServer()
server.bind(('0.0.0.0', 8000))
print('ready')

server.serve_forever()

'''
import threading, webbrowser

f = lambda : server.serve_forever()
t=threading.Thread(target=f)
t.daemon=True
t.start()

webbrowser.open_new_tab('http://localhost:3022/materials.html')
'''
