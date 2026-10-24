from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree
import re

base=Path(__file__).parent
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
with ZipFile(base/'draft.pptx') as source, ZipFile(base/'candidate-rtl.pptx','w',ZIP_DEFLATED) as target:
    for info in source.infolist():
        data=source.read(info.filename)
        if re.fullmatch(r'ppt/slides/slide\d+\.xml',info.filename):
            root=etree.fromstring(data)
            for paragraph in root.findall('.//a:p',ns):
                text=''.join(paragraph.xpath('.//a:t/text()',namespaces=ns))
                if re.search(r'[\u0600-\u06ff]',text):
                    props=paragraph.find('a:pPr',ns)
                    if props is None:
                        props=etree.Element('{%s}pPr'%ns['a']);paragraph.insert(0,props)
                    props.set('rtl','1')
                    for run in paragraph.findall('a:r',ns):
                        style=run.find('a:rPr',ns)
                        if style is not None:style.set('lang','fa-IR')
            data=etree.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True)
        target.writestr(info,data)
print('Native Persian paragraph direction applied')
