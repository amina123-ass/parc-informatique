<?php
// database/seeders/SousCategorieAttributesSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Dico\SousCategorie;
use App\Models\SousCategorieAttribute;

class SousCategorieAttributesSeeder extends Seeder
{
    /**
     * Méthode helper pour créer les attributs
     */
    private function createAttributes(int $sousCategoryId, array $attributes): void
    {
        foreach ($attributes as $attr) {
            SousCategorieAttribute::updateOrCreate(
                [
                    'sous_category_id' => $sousCategoryId,
                    'key' => $attr['key'],
                ],
                [
                    'label' => $attr['label'],
                    'type' => $attr['type'],
                    'options' => $attr['options'] ?? null,
                    'data_key' => $attr['data_key'] ?? null,
                    'label_field' => $attr['label_field'] ?? null,
                    'value_field' => $attr['value_field'] ?? null,
                    'ordre' => $attr['ordre'],
                    'required' => $attr['required'] ?? false,
                ]
            );
        }
    }

    public function run(): void
    {
        $this->command->info('🚀 Création des attributs des sous-catégories...');
        $this->command->info('');

        // ═══════════════════════════════════════════════════════════
        // PC (Portable, Bureau, Serveur)
        // ═══════════════════════════════════════════════════════════
        $pcTypes = ['PC Portable', 'PC Bureau', 'PC Serveur'];
        
        foreach ($pcTypes as $pcType) {
            $pc = SousCategorie::where('nom', $pcType)->first();
            
            if ($pc) {
                $this->createAttributes($pc->id, [
                    [
                        'key' => 'processeur',
                        'label' => 'Processeur (ex: i5, i7)',
                        'type' => 'text',
                        'ordre' => 0,
                        'required' => false,
                    ],
                    [
                        'key' => 'ram',
                        'label' => 'RAM (Go)',
                        'type' => 'text',
                        'ordre' => 1,
                        'required' => false,
                    ],
                    [
                        'key' => 'taille_dd',
                        'label' => 'Taille disque dur (Go/To)',
                        'type' => 'text',
                        'ordre' => 2,
                        'required' => false,
                    ],
                    [
                        'key' => 'type_disque',
                        'label' => 'Type de disque',
                        'type' => 'select',
                        'options' => ['HDD', 'SSD', 'SATA', 'NVMe'],
                        'ordre' => 3,
                        'required' => false,
                    ],
                    [
                        'key' => 'taille_ecran',
                        'label' => 'Taille écran (pouces)',
                        'type' => 'text',
                        'ordre' => 4,
                        'required' => false,
                    ],
                    [
                        'key' => 'souris',
                        'label' => 'Souris incluse',
                        'type' => 'select',
                        'options' => ['oui', 'non'],
                        'ordre' => 5,
                        'required' => false,
                    ],
                    [
                        'key' => 'ip',
                        'label' => 'Adresse IP',
                        'type' => 'text',
                        'ordre' => 6,
                        'required' => false,
                    ],
                    [
                        'key' => 'connexion',
                        'label' => 'Type de connexion',
                        'type' => 'select',
                        'options' => ['internet', 'wifi', 'internet+wifi', 'bluetooth', 'usb'],
                        'ordre' => 7,
                        'required' => false,
                    ],
                    [
                        'key' => 'clavier',
                        'label' => 'Type de clavier',
                        'type' => 'select',
                        'options' => ['AZERTY', 'QWERTY'],
                        'ordre' => 8,
                        'required' => false,
                    ],
                    [
                        'key' => 'system_exploitation',
                        'label' => 'Système d\'exploitation',
                        'type' => 'api_select',
                        'data_key' => 'systemesExploitation',
                        'label_field' => 'nom',
                        'value_field' => 'nom',
                        'ordre' => 9,
                        'required' => false,
                    ],
                ]);
                
                $this->command->info("✓ {$pcType}: 10 attributs créés");
            } else {
                $this->command->warn("⚠ {$pcType} introuvable");
            }
        }

        // ═══════════════════════════════════════════════════════════
        // IMPRIMANTE
        // ═══════════════════════════════════════════════════════════
        $imprimante = SousCategorie::where('nom', 'Imprimante')->first();
        
        if ($imprimante) {
            $this->createAttributes($imprimante->id, [
                [
                    'key' => 'couleur',
                    'label' => 'Couleur',
                    'type' => 'select',
                    'options' => ['oui', 'non'],
                    'ordre' => 0,
                    'required' => false,
                ],
                [
                    'key' => 'technologie_imprimante',
                    'label' => 'Technologie',
                    'type' => 'select',
                    'options' => ['laser', 'jet_encre', 'thermique', 'multifonction'],
                    'ordre' => 1,
                    'required' => false,
                ],
                [
                    'key' => 'reseau',
                    'label' => 'Réseau',
                    'type' => 'select',
                    'options' => ['USB', 'WIFI', 'Ethernet', 'USB+WIFI'],
                    'ordre' => 2,
                    'required' => false,
                ],
                [
                    'key' => 'recto_verso',
                    'label' => 'Recto-Verso',
                    'type' => 'select',
                    'options' => ['oui', 'non'],
                    'ordre' => 3,
                    'required' => false,
                ],
                [
                    'key' => 'type_imp',
                    'label' => 'Type imprimante',
                    'type' => 'select',
                    'options' => ['A4', 'A3', 'A4/A3', '3 en 1'],
                    'ordre' => 4,
                    'required' => false,
                ],
                [
                    'key' => 'cartouche_id',
                    'label' => 'Cartouche compatible',
                    'type' => 'api_select',
                    'data_key' => 'cartouches',
                    'label_field' => 'reference',
                    'value_field' => 'id',
                    'ordre' => 5,
                    'required' => false,
                ],
            ]);
            
            $this->command->info("✓ Imprimante: 6 attributs créés");
        } else {
            $this->command->warn("⚠ Imprimante introuvable");
        }

        // ═══════════════════════════════════════════════════════════
        // SCANNER
        // ═══════════════════════════════════════════════════════════
        $scanner = SousCategorie::where('nom', 'Scanner')->first();
        
        if ($scanner) {
            $this->createAttributes($scanner->id, [
                [
                    'key' => 'couleur',
                    'label' => 'Couleur',
                    'type' => 'select',
                    'options' => ['oui', 'non'],
                    'ordre' => 0,
                    'required' => false,
                ],
                [
                    'key' => 'recto_verso',
                    'label' => 'Recto-Verso',
                    'type' => 'select',
                    'options' => ['oui', 'non'],
                    'ordre' => 1,
                    'required' => false,
                ],
                [
                    'key' => 'type_scanner',
                    'label' => 'Type de scanner',
                    'type' => 'select',
                    'options' => ['A plat', 'Chargeur', 'Combiné'],
                    'ordre' => 2,
                    'required' => false,
                ],
                [
                    'key' => 'resolution',
                    'label' => 'Résolution (DPI)',
                    'type' => 'text',
                    'ordre' => 3,
                    'required' => false,
                ],
            ]);
            
            $this->command->info("✓ Scanner: 4 attributs créés");
        } else {
            $this->command->warn("⚠ Scanner introuvable");
        }

        // ═══════════════════════════════════════════════════════════
        // FAX
        // ═══════════════════════════════════════════════════════════
        $fax = SousCategorie::where('nom', 'Fax')->first();
        
        if ($fax) {
            $this->createAttributes($fax->id, [
                [
                    'key' => 'combine',
                    'label' => 'Combiné téléphonique',
                    'type' => 'select',
                    'options' => ['oui', 'non'],
                    'ordre' => 0,
                    'required' => false,
                ],
                [
                    'key' => 'type_fax',
                    'label' => 'Type de fax',
                    'type' => 'select',
                    'options' => ['Thermique', 'Laser', 'Jet d\'encre'],
                    'ordre' => 1,
                    'required' => false,
                ],
                [
                    'key' => 'memoire',
                    'label' => 'Mémoire (pages)',
                    'type' => 'number',
                    'ordre' => 2,
                    'required' => false,
                ],
            ]);
            
            $this->command->info("✓ Fax: 3 attributs créés");
        } else {
            $this->command->warn("⚠ Fax introuvable");
        }

        // ═══════════════════════════════════════════════════════════
        // WEBCAM
        // ═══════════════════════════════════════════════════════════
        $webcam = SousCategorie::where('nom', 'WebCam')->first();
        
        if ($webcam) {
            $this->createAttributes($webcam->id, [
                [
                    'key' => 'microphone',
                    'label' => 'Microphone intégré',
                    'type' => 'select',
                    'options' => ['oui', 'non'],
                    'ordre' => 0,
                    'required' => false,
                ],
                [
                    'key' => 'resolution',
                    'label' => 'Résolution',
                    'type' => 'select',
                    'options' => ['2MP', '5MP', '8MP', '1080p', '4K'],
                    'ordre' => 1,
                    'required' => false,
                ],
                [
                    'key' => 'type_connexion',
                    'label' => 'Type de connexion',
                    'type' => 'select',
                    'options' => ['USB', 'USB-C', 'Sans fil'],
                    'ordre' => 2,
                    'required' => false,
                ],
            ]);
            
            $this->command->info("✓ WebCam: 3 attributs créés");
        } else {
            $this->command->warn("⚠ WebCam introuvable");
        }

        // ═══════════════════════════════════════════════════════════
        // POINT D'ACCÈS
        // ═══════════════════════════════════════════════════════════
        $pointAcces = SousCategorie::where('nom', 'Point d\'accès')->first();
        
        if (!$pointAcces) {
            // Essayer d'autres variantes
            $pointAcces = SousCategorie::where('nom', 'LIKE', '%Point%')->orWhere('nom', 'PointAcces')->first();
        }
        
        if ($pointAcces) {
            $this->createAttributes($pointAcces->id, [
                [
                    'key' => 'bande',
                    'label' => 'Bande de fréquence',
                    'type' => 'select',
                    'options' => ['2.4GHz', '5GHz', 'Dual Band (2.4GHz + 5GHz)'],
                    'ordre' => 0,
                    'required' => false,
                ],
                [
                    'key' => 'norme_wifi',
                    'label' => 'Norme WiFi',
                    'type' => 'select',
                    'options' => ['WiFi 4 (802.11n)', 'WiFi 5 (802.11ac)', 'WiFi 6 (802.11ax)', 'WiFi 6E'],
                    'ordre' => 1,
                    'required' => false,
                ],
                [
                    'key' => 'portee',
                    'label' => 'Portée (mètres)',
                    'type' => 'text',
                    'ordre' => 2,
                    'required' => false,
                ],
                [
                    'key' => 'nombre_ports',
                    'label' => 'Nombre de ports Ethernet',
                    'type' => 'number',
                    'ordre' => 3,
                    'required' => false,
                ],
            ]);
            
            $this->command->info("✓ Point d'accès: 4 attributs créés");
        } else {
            $this->command->warn("⚠ Point d'accès introuvable");
        }

        // ═══════════════════════════════════════════════════════════
        // SWITCH
        // ═══════════════════════════════════════════════════════════
        $switch = SousCategorie::where('nom', 'Switch')->first();
        
        if ($switch) {
            $this->createAttributes($switch->id, [
                [
                    'key' => 'nombre_ports',
                    'label' => 'Nombre de ports',
                    'type' => 'select',
                    'options' => ['8', '16', '24', '48'],
                    'ordre' => 0,
                    'required' => false,
                ],
                [
                    'key' => 'type_switch',
                    'label' => 'Type',
                    'type' => 'select',
                    'options' => ['Manageable', 'Non manageable'],
                    'ordre' => 1,
                    'required' => false,
                ],
                [
                    'key' => 'vitesse',
                    'label' => 'Vitesse',
                    'type' => 'select',
                    'options' => ['Fast Ethernet (100 Mbps)', 'Gigabit (1 Gbps)', '10 Gigabit'],
                    'ordre' => 2,
                    'required' => false,
                ],
                [
                    'key' => 'poe',
                    'label' => 'Support PoE (Power over Ethernet)',
                    'type' => 'select',
                    'options' => ['oui', 'non'],
                    'ordre' => 3,
                    'required' => false,
                ],
            ]);
            
            $this->command->info("✓ Switch: 4 attributs créés");
        } else {
            $this->command->warn("⚠ Switch introuvable");
        }

        // ═══════════════════════════════════════════════════════════
        // ROUTEUR
        // ═══════════════════════════════════════════════════════════
        $routeur = SousCategorie::where('nom', 'Routeur')->first();
        
        if ($routeur) {
            $this->createAttributes($routeur->id, [
                [
                    'key' => 'type_routeur',
                    'label' => 'Type de routeur',
                    'type' => 'select',
                    'options' => ['WiFi', 'Filaire', 'WiFi + Filaire', '4G/5G'],
                    'ordre' => 0,
                    'required' => false,
                ],
                [
                    'key' => 'nombre_ports',
                    'label' => 'Nombre de ports',
                    'type' => 'number',
                    'ordre' => 1,
                    'required' => false,
                ],
                [
                    'key' => 'norme_wifi',
                    'label' => 'Norme WiFi',
                    'type' => 'select',
                    'options' => ['WiFi 4', 'WiFi 5', 'WiFi 6', 'WiFi 6E'],
                    'ordre' => 2,
                    'required' => false,
                ],
                [
                    'key' => 'vpn',
                    'label' => 'Support VPN',
                    'type' => 'select',
                    'options' => ['oui', 'non'],
                    'ordre' => 3,
                    'required' => false,
                ],
            ]);
            
            $this->command->info("✓ Routeur: 4 attributs créés");
        } else {
            $this->command->warn("⚠ Routeur introuvable");
        }

        // ═══════════════════════════════════════════════════════════
        // ONDULEUR
        // ═══════════════════════════════════════════════════════════
        $onduleur = SousCategorie::where('nom', 'Onduleur')->first();
        
        if ($onduleur) {
            $this->createAttributes($onduleur->id, [
                [
                    'key' => 'puissance',
                    'label' => 'Puissance (VA)',
                    'type' => 'number',
                    'ordre' => 0,
                    'required' => false,
                ],
                [
                    'key' => 'autonomie',
                    'label' => 'Autonomie (minutes)',
                    'type' => 'number',
                    'ordre' => 1,
                    'required' => false,
                ],
                [
                    'key' => 'nbr_sortie',
                    'label' => 'Nombre de sorties',
                    'type' => 'number',
                    'ordre' => 2,
                    'required' => false,
                ],
                [
                    'key' => 'type_onduleur',
                    'label' => 'Type',
                    'type' => 'select',
                    'options' => ['Off-line', 'Line-interactive', 'On-line'],
                    'ordre' => 3,
                    'required' => false,
                ],
            ]);
            
            $this->command->info("✓ Onduleur: 4 attributs créés");
        } else {
            $this->command->warn("⚠ Onduleur introuvable");
        }

        // ═══════════════════════════════════════════════════════════
        // CAMÉRA
        // ═══════════════════════════════════════════════════════════
        $camera = SousCategorie::where('nom', 'LIKE', '%Cam%')
            ->orWhere('nom', 'Caméra')
            ->first();
        
        if ($camera) {
            $this->createAttributes($camera->id, [
                [
                    'key' => 'resolution',
                    'label' => 'Résolution',
                    'type' => 'select',
                    'options' => ['720p', '1080p', '2MP', '4MP', '5MP', '4K'],
                    'ordre' => 0,
                    'required' => false,
                ],
                [
                    'key' => 'type_camera',
                    'label' => 'Type',
                    'type' => 'select',
                    'options' => ['IP', 'Analogique', 'WiFi', 'PTZ'],
                    'ordre' => 1,
                    'required' => false,
                ],
                [
                    'key' => 'vision_nocturne',
                    'label' => 'Vision nocturne',
                    'type' => 'select',
                    'options' => ['oui', 'non'],
                    'ordre' => 2,
                    'required' => false,
                ],
                [
                    'key' => 'audio',
                    'label' => 'Audio intégré',
                    'type' => 'select',
                    'options' => ['oui', 'non'],
                    'ordre' => 3,
                    'required' => false,
                ],
            ]);
            
            $this->command->info("✓ Caméra: 4 attributs créés");
        } else {
            $this->command->warn("⚠ Caméra introuvable");
        }

        // ═══════════════════════════════════════════════════════════
        // AUTRES (Catégorie générique)
        // ═══════════════════════════════════════════════════════════
        $autres = SousCategorie::where('nom', 'Autres')->first();
        
        if ($autres) {
            $this->createAttributes($autres->id, [
                [
                    'key' => 'description',
                    'label' => 'Description technique',
                    'type' => 'text',
                    'ordre' => 0,
                    'required' => false,
                ],
                [
                    'key' => 'caracteristiques',
                    'label' => 'Caractéristiques principales',
                    'type' => 'text',
                    'ordre' => 1,
                    'required' => false,
                ],
            ]);
            
            $this->command->info("✓ Autres: 2 attributs créés");
        }

        $this->command->info('');
        $this->command->info('═══════════════════════════════════════════');
        $this->command->info('✅ Seedage terminé avec succès !');
        $this->command->info('═══════════════════════════════════════════');
    }
}