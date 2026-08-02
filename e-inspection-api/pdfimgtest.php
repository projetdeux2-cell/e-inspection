<?php
require __DIR__ . '/vendor/autoload.php';

use Dompdf\Dompdf;
use Dompdf\Options;

$png = 'C:\xampp\htdocs\e-inspection\e-inspection-api\public\signatures\signature-koffi.png';

$options = new Options();
$options->set('isRemoteEnabled', true);
$options->set('defaultFont', 'DejaVu Sans');

$variants = [
    'fileUri' => 'file:///C:/xampp/htdocs/e-inspection/e-inspection-api/public/signatures/signature-koffi.png',
    'absPath' => 'C:/xampp/htdocs/e-inspection/e-inspection-api/public/signatures/signature-koffi.png',
    'httpUrl' => 'http://127.0.0.1:8000/signatures/signature-koffi.png',
    'dataUri' => 'data:image/png;base64,' . base64_encode(file_get_contents($png)),
];

foreach ($variants as $name => $src) {
    try {
        $html = '<html><body><p>Test ' . $name . '</p><img src="' . $src . '" /></body></html>';
        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->render();
        $out = $dompdf->output();
        $images = substr_count($out, '/Image');
        printf("%-9s -> %d image objects, %d bytes\n", $name, $images, strlen($out));
    } catch (\Throwable $e) {
        printf("%-9s -> ERROR: %s\n", $name, $e->getMessage());
    }
}
