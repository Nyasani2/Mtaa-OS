import os
real=0
for root,dirs,files in os.walk('app'):
    for f in files:
        if f.endswith(('.tsx','.ts')) and f!='_layout.tsx':
            n=f.rsplit('.',1)[0]
            if n in dirs and os.path.exists(os.path.join(root,n,'_layout.tsx')):
                print('REAL:',os.path.join(root,f)); real+=1
print('no real conflicts' if not real else str(real)+' real')
