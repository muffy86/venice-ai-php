<?php

namespace Venice\N8n;

class N8nService
{
    private string $apiUrl;
    private string $apiKey;

    public function __construct(string $apiUrl, string $apiKey)
    {
        $this->apiUrl = rtrim($apiUrl, '/');
        $this->apiKey = $apiKey;
    }

    public function createWorkflow(array $workflow): array
    {
        return $this->request('POST', '/api/v1/workflows', $workflow);
    }

    public function executeWorkflow(string $workflowId, array $data = []): array
    {
        return $this->request('POST', "/api/v1/workflows/{$workflowId}/execute", $data);
    }

    public function getWorkflows(): array
    {
        return $this->request('GET', '/api/v1/workflows');
    }

    private function request(string $method, string $endpoint, array $data = []): array
    {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->apiUrl . $endpoint,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-N8N-API-KEY: ' . $this->apiKey
            ],
            CURLOPT_POSTFIELDS => $data ? json_encode($data) : null,
            CURLOPT_TIMEOUT => 30
        ]);

        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true) ?? [];
    }
}