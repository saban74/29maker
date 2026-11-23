import json
s=open('game.src.html').read()
s=s.replace('/*KMETA*/',open('assets/kids.json').read())
s=s.replace('/*OMETA*/',open('assets/objects.json').read())
s=s.replace('/*RMETA*/',open('assets/rivals.json').read())
open('index.html','w').write(s);print(len(s))
