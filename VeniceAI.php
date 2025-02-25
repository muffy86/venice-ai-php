<?php

/**
 * Venice AI PHP SDK - Legacy Adapter
 * 
 * This file provides backward compatibility with existing code.
 * For new projects, consider using the modern structure:
 * 
 * require_once __DIR__ . '/VeniceAI-legacy.php';
 */

// Load the legacy adapter that implements the original API
require_once __DIR__ . '/VeniceAI-legacy.php';

// The VeniceAI class is automatically aliased from VeniceAI_Legacy
// No additional code needed here - this file simply serves as a 
// compatibility shim for existing code