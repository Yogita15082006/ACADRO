import urllib.request

urls = [
    'https://mirrors.aliyun.com/pypi/packages/cf/09/b24c266cd61ddeed101b90c92a26f54d060b06f4a1b102eb891576d6e9e2/opencv_python-4.6.0.66-cp36-abi3-win_amd64.whl',
    'https://mirrors.aliyun.com/pypi/packages/63/0b/6ef1acbaa21e5245c85a42f9f0ecfaf2e7420b24615a00f0eee170328e6b/opencv_contrib_python-4.6.0.66-cp36-abi3-win_amd64.whl'
]

for url in urls:
    filename = url.split('/')[-1]
    print(f'Downloading {filename}...')
    urllib.request.urlretrieve(url, filename)
    print(f'Done downloading {filename}')
