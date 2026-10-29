from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parent.parent
with ZipFile(root / 'wordpress/vinyl-archive-theme.zip', 'w', ZIP_DEFLATED) as archive:
    for path in sorted((root / 'wordpress/vinyl-archive').rglob('*')):
        if path.is_file():
            archive.write(path, path.relative_to(root / 'wordpress'))
print('wordpress/vinyl-archive-theme.zip hazır.')

with ZipFile(root / 'wordpress/vinyl-nocodb-plugin.zip', 'w', ZIP_DEFLATED) as archive:
    for path in sorted((root / 'wordpress/vinyl-nocodb').rglob('*')):
        if path.is_file():
            archive.write(path, path.relative_to(root / 'wordpress'))
print('wordpress/vinyl-nocodb-plugin.zip hazır.')

# Keep versioned downloadable artifacts beside the latest install packages.
import re
from shutil import copyfile
for package, metadata in [
    ('vinyl-archive-theme', 'vinyl-archive/style.css'),
    ('vinyl-nocodb-plugin', 'vinyl-nocodb/vinyl-nocodb.php'),
]:
    version = re.search(r'Version:\s*([0-9.]+)', (root / 'wordpress' / metadata).read_text()).group(1)
    destination = root / 'wordpress' / f'{package}-{version}.zip'
    copyfile(root / 'wordpress' / f'{package}.zip', destination)
    print(f'{destination.name} hazır.')
