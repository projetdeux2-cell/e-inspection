<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport {{ $report['reference'] }}</title>
    <style>
        @page { margin: 20mm 15mm; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; padding: 0; margin: 0; color: #0a1e3c; }
        .header { background: linear-gradient(135deg, #0a1e3c 0%, #1a3a5c 100%); color: #fff; padding: 32px 40px; }
        .header h1 { margin: 0 0 4px; font-size: 26px; font-weight: 800; }
        .header p { margin: 0; font-size: 14px; opacity: .8; }
        .content { padding: 32px 40px; }
        .meta-grid { width: 100%; margin-bottom: 28px; }
        .meta-row { width: 100%; }
        .meta-item { display: inline-block; width: 49%; vertical-align: top; margin-bottom: 14px; }
        .meta-item strong { display: block; font-size: 11px; text-transform: uppercase; color: #6b7a93; margin-bottom: 2px; }
        .meta-item span { font-size: 15px; font-weight: 700; color: #0a1e3c; }
        .score-banner { padding: 24px; border-radius: 14px; margin-bottom: 28px; }
        .score-banner.excellent { background: #ecfdf5; border: 1px solid #a7f3d0; }
        .score-banner.bien { background: #eff6ff; border: 1px solid #bfdbfe; }
        .score-banner.moyen { background: #fff7ed; border: 1px solid #fed7aa; }
        .score-banner.insuffisant { background: #fef2f2; border: 1px solid #fecaca; }
        .score-banner .score-number { font-size: 48px; font-weight: 900; }
        .score-banner.excellent .score-number { color: #059669; }
        .score-banner.bien .score-number { color: #2563eb; }
        .score-banner.moyen .score-number { color: #ea580c; }
        .score-banner.insuffisant .score-number { color: #dc2626; }
        .score-banner .score-label strong { font-size: 18px; display: block; }
        .score-banner .score-label small { font-size: 13px; color: #6b7a93; }
        h2 { font-size: 18px; font-weight: 800; margin: 0 0 16px; color: #0a1e3c; }
        .detail-grid { width: 100%; margin-bottom: 28px; }
        .detail-row { width: 100%; }
        .detail-item { display: inline-block; width: 49%; vertical-align: top; box-sizing: border-box; padding: 12px 16px; background: #f8fafc; border-radius: 10px; margin-bottom: 10px; }
        .detail-item .label { font-size: 14px; color: #475467; }
        .detail-item .value { font-weight: 800; color: #0a1e3c; }
        .section { margin-bottom: 24px; }
        .section h3 { font-size: 15px; font-weight: 700; margin: 0 0 8px; color: #0a1e3c; }
        .section p, .section li { font-size: 14px; line-height: 1.6; color: #475467; }
        .section ul { padding-left: 20px; margin: 0; }
        .footer { text-align: center; padding: 20px 40px; border-top: 1px solid #eef2f7; font-size: 12px; color: #9aaec5; }
        .signature { margin-top: 24px; padding: 16px; border: 1px solid #e4e9f0; border-radius: 12px; }
        .signature img { max-width: 240px; border: 1px solid #e4e9f0; border-radius: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Rapport d'inspection pedagogique</h1>
        <p>Ministere des Enseignements Maternel et Primaire - EducInspect</p>
    </div>
    <div class="content">
        <div class="meta-grid">
            <div class="meta-row">
                <div class="meta-item"><strong>Reference</strong><span>{{ $report['reference'] }}</span></div>
                <div class="meta-item"><strong>Date d'inspection</strong><span>{{ $report['date'] }}</span></div>
            </div>
            <div class="meta-row">
                <div class="meta-item"><strong>Ecole</strong><span>{{ $report['school'] }}</span></div>
                <div class="meta-item"><strong>Statut</strong><span>{{ $report['status'] }}</span></div>
            </div>
            @if(!empty($report['teacher']))
                <div class="meta-row">
                    <div class="meta-item"><strong>Enseignant</strong><span>{{ $report['teacher'] }}</span></div>
                </div>
            @endif
        </div>
        <div class="score-banner {{ $evalClass }}">
            <div class="score-number">{{ $score }}%</div>
            <div class="score-label"><strong>{{ $evalLabel }}</strong><small>Score global d'inspection</small></div>
        </div>
        <h2>Details de l'evaluation</h2>
        <div class="detail-grid">
            <div class="detail-row">
                <div class="detail-item"><span class="label">Preparation des cours</span><span class="value">{{ $report['preparation'] }}%</span></div>
                <div class="detail-item"><span class="label">Pedagogie et methodes</span><span class="value">{{ $report['pedagogie'] }}%</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-item"><span class="label">Gestion de classe</span><span class="value">{{ $report['gestion'] }}%</span></div>
                <div class="detail-item"><span class="label">Documents scolaires</span><span class="value">{{ $report['documents'] }}%</span></div>
            </div>
        </div>
        <div class="section">
            <h3>Observations</h3>
            <p>{{ $report['observations'] ?: 'Aucune observation saisie.' }}</p>
        </div>
        <div class="section">
            <h3>Recommandations</h3>
            @if(count($recommendations) > 0)
                <ul>
                    @foreach($recommendations as $r)
                        <li>{{ $r }}</li>
                    @endforeach
                </ul>
            @else
                <p>Aucune recommandation.</p>
            @endif
        </div>
        <div class="section">
            <h3>Notes techniques</h3>
            <p>{{ $report['notes'] ?: 'Aucune note.' }}</p>
        </div>
        @if($signature)
            <div class="signature"><strong>Signature</strong><div><img src="{{ $signature }}" alt="Signature inspecteur"></div></div>
        @endif
    </div>
    <div class="footer">
        <p>Document genere par EducInspect &bull; {{ now()->locale('fr')->translatedFormat('d/m/Y') }}</p>
    </div>
</body>
</html>
