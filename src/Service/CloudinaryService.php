<?php

namespace App\Service;

use Cloudinary\Api\ApiResponse;
use Cloudinary\Api\Exception\ApiError;
use Cloudinary\Cloudinary;
use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class CloudinaryService
{
    private Cloudinary $cloudinary;
    private const DEFAULT_ALLOWED_FORMATS = ['image/jpeg', 'image/png'];

    public function __construct(string $cloudName, string $apiKey, string $apiSecret)
    {
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => $cloudName,
                'api_key' => $apiKey,
                'api_secret' => $apiSecret,
            ],
            'url' => [
                'secure' => true
            ]
        ]);
    }

    /**
     * @throws ApiError
     */
    public function upload(string $filePath): ApiResponse
    {
        return $this->cloudinary->uploadApi()->upload($filePath);
    }

    /**
     * @throws ApiError
     */
    public function uploadPhoto(UploadedFile $photoFile)
    {
        // Vérification des erreurs PHP lié à la taille des fichiers
        $chekPhpError = $this->checkPHPErrors($photoFile);
        if (!$chekPhpError['success']) {
            return $chekPhpError;
        }

        // Vérification du format du fichier
        $checkFormat = $this->checkFormat($photoFile, self::DEFAULT_ALLOWED_FORMATS);
        if (!$checkFormat['success']) {
            return $checkFormat;
        }

        // On upload la photo sur Cloudinary
        $result = $this->upload($photoFile->getPathname());

        // on obtient l'URL publique via $result['secure_url']
        return [
            'success' => true,
            'url' => $result['secure_url'],
        ];
    }


    public function checkPHPErrors(UploadedFile $photoFile): array
    {
        if (!$photoFile->isValid()) {
            if ($photoFile->getError() === UPLOAD_ERR_INI_SIZE) {
                return [
                    'success' => false,
                    'error' => 'Votre photo doit faire moins de 2M.',
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'Une erreur est survenue lors du téléchargement du fichier.',
                ];
            }
        }

        return [
            'success' => true,
            'error' => null,
        ];
    }


    public function checkFormat(UploadedFile $photoFile, array $formats): array
    {
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $photoFormat = $finfo->file($photoFile->getPathname());
        if (!in_array($photoFormat, $formats, true)) {
            return [
                'success' => false,
                'error' => 'Seuls les fichiers JPEG ou PNG sont autorisés.',
            ];
        }
        return [
            'success' => true,
            'error' => null,
        ];
    }

}