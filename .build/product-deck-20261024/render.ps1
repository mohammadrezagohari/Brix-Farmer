$ErrorActionPreference='Stop'
$deckPath='C:\Users\USER\Desktop\Brix-Farmer\outputs\AgriTrade_Product_Showcase_FA_Final.pptx'
$renderPath='C:\Users\USER\Desktop\Brix-Farmer\.build\product-deck-20261024\renders'
$app=New-Object -ComObject PowerPoint.Application
$deck=$null
try {
 $deck=$app.Presentations.Open($deckPath,-1,0,0)
 $findings=@()
 foreach($slide in $deck.Slides){
  $file=Join-Path $renderPath ('slide-{0:d2}.png' -f $slide.SlideIndex)
  $slide.Export($file,'PNG',1280,720)
  foreach($shape in $slide.Shapes){
   if($shape.HasTextFrame -eq -1 -and $shape.TextFrame2.HasText -eq -1){
    $range=$shape.TextFrame2.TextRange
    if($range.BoundHeight -gt ($shape.Height+3) -or $range.BoundWidth -gt ($shape.Width+3)){
     $findings+=@{slide=$slide.SlideIndex;name=$shape.Name;text=$range.Text;height=$shape.Height;boundHeight=$range.BoundHeight;width=$shape.Width;boundWidth=$range.BoundWidth}
    }
   }
  }
 }
 $result=@{slideCount=$deck.Slides.Count;application='PowerPoint 16.0';textFitFindings=@($findings)}
 $result | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 (Join-Path $renderPath 'native-fit.json')
 Write-Output ('Rendered {0} slides; native text-fit findings: {1}' -f $deck.Slides.Count,$findings.Count)
} finally {
 if($deck){$deck.Close();[Runtime.InteropServices.Marshal]::ReleaseComObject($deck)|Out-Null}
 [Runtime.InteropServices.Marshal]::ReleaseComObject($app)|Out-Null
}
