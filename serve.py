import http.server, re, os
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kw):super().__init__(*args,directory='/Users/raoufhamouda/Desktop/REALISATEUR_SITE',**kw)
    def send_head(self):
        self.byte_range=None
        path=self.translate_path(self.path)
        if 'Range' not in self.headers or not os.path.isfile(path):return super().send_head()
        f=open(path,'rb');size=os.fstat(f.fileno()).st_size
        m=re.match(r'bytes=(\d+)-(\d*)$',self.headers['Range'])
        if not m:f.close();return super().send_head()
        start=int(m[1]);end=min(int(m[2]) if m[2] else size-1,size-1)
        if start>=size:self.send_error(416);f.close();return None
        self.send_response(206);self.send_header('Content-type',self.guess_type(path));self.send_header('Accept-Ranges','bytes');self.send_header('Content-Range',f'bytes {start}-{end}/{size}');self.send_header('Content-Length',str(end-start+1));self.end_headers();f.seek(start);self.byte_range=(start,end);return f
    def copyfile(self,source,outputfile):
        if not self.byte_range:return super().copyfile(source,outputfile)
        remaining=self.byte_range[1]-self.byte_range[0]+1
        while remaining:
            chunk=source.read(min(65536,remaining))
            if not chunk:break
            outputfile.write(chunk);remaining-=len(chunk)
http.server.ThreadingHTTPServer(('127.0.0.1',8463),Handler).serve_forever()
