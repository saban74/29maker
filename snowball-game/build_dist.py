# proto/index.html -> dist/snowfight (zip용) 와 cf/public (Cloudflare용) 을 만듭니다
import os, shutil
B=os.path.dirname(os.path.abspath(__file__))
s=open(f'{B}/proto/index.html').read()
html='<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<style>html,body{margin:0;height:100%}</style>\n'
i=s.index('<style>');head=s[:i];rest=s[i:];j=rest.index('</style>')+8
page=html+head+rest[:j]+'\n</head>\n<body>\n'+rest[j:]+'\n</body>\n</html>\n'
open(f'{B}/dist/snowfight/index.html','w').write(page)
pub=f'{B}/cf/public'
if os.path.exists(pub): shutil.rmtree(pub)
shutil.copytree(f'{B}/dist/snowfight',pub,ignore=shutil.ignore_patterns('README.txt'))
print('built',len(page))
