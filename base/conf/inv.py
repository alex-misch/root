import sys
from urlparse import parse_qsl


print(
	dict(
		parse_qsl(
			sys.stdin.read()
		)
	)
)
