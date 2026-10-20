"""Fail CI if the APK ABI scope or native compression regresses."""
import sys
import zipfile
from pathlib import Path


def verify(path, expected_abis):
    with zipfile.ZipFile(path) as apk:
        libraries = [entry for entry in apk.infolist()
                     if entry.filename.startswith('lib/') and entry.filename.endswith('.so')]
        abis = {entry.filename.split('/')[1] for entry in libraries}
        if abis != expected_abis:
            raise ValueError(f'{path}: expected ABIs {expected_abis}, got {abis}')
        uncompressed = [entry.filename for entry in libraries
                        if entry.compress_type == zipfile.ZIP_STORED]
        if uncompressed:
            raise ValueError(f'{path}: native libraries are not compressed: {uncompressed}')
    print(f'{Path(path).name}: {Path(path).stat().st_size / 1048576:.1f} MiB; ABIs: {sorted(abis)}')


if __name__ == '__main__':
    verify(sys.argv[1], {'arm64-v8a'})
    verify(sys.argv[2], {'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'})
