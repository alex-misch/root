#!/usr/bin/env python2
from SimpleHTTPServer import SimpleHTTPRequestHandler
import BaseHTTPServer
import SocketServer
import sys


class CustomRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)



class ThreadingSimpleServer(SocketServer.ThreadingMixIn, BaseHTTPServer.HTTPServer):
    pass



server = ThreadingSimpleServer(('', 9200), CustomRequestHandler)


if __name__ == '__main__':
    try:
        # BaseHTTPServer.test(CustomRequestHandler, server)
        while 1:

            sys.stdout.flush()
            server.handle_request()
    except KeyboardInterrupt:
        print "Finished"
