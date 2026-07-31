import urllib.request
url = 'https://pypi.tuna.tsinghua.edu.cn/packages/b8/88/763b967f7efd7226b82c9fae16d560cba049b1f0c036647e65c610fd636e/opencv_python_headless-5.0.0.93-cp37-abi3-win_amd64.whl'
filename = url.split('/')[-1]
print(f'Downloading {filename}...')
urllib.request.urlretrieve(url, filename)
print(f'Done downloading {filename}')
