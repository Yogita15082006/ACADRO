import urllib.request
url = 'https://mirrors.aliyun.com/pypi/packages/2b/54/9a9edb45345bd6744da5ddfb6628e5d5185920494c6a67ec45b6381004cb/scipy-1.18.0-cp312-cp312-win_amd64.whl'
filename = url.split('/')[-1]
print(f'Downloading {filename}...')
urllib.request.urlretrieve(url, filename)
print(f'Done downloading {filename}')
