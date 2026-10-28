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
