<?php

namespace Venice\Events;

use Psr\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\EventDispatcher\EventDispatcher;
use Venice\Utils\Logger;
use Venice\Exceptions\VeniceException;

/**
 * Advanced event management system for Venice AI SDK
 *
 * Provides:
 * - Event dispatching and handling
 * - Asynchronous event processing
 * - Event prioritization
 * - Event filtering
 * - Event logging and monitoring
 * - Plugin system integration
 */
class EventManager implements EventDispatcherInterface {
    /** @var EventDispatcher Symfony event dispatcher */
    private EventDispatcher $dispatcher;

    /** @var Logger Logger instance */
    private Logger $logger;

    /** @var array Event statistics */
    private array $stats = [
        'dispatched' => 0,
        'handled' => 0,
        'errors' => 0
    ];

    /** @var array Registered event types */
    private const EVENT_TYPES = [
        // Core events
        'venice.init' => 'Core initialization',
        'venice.shutdown' => 'System shutdown',
        'venice.error' => 'Error occurred',

        // API events
        'venice.api.request' => 'API request made',
        'venice.api.response' => 'API response received',
        'venice.api.error' => 'API error occurred',

        // Service events
        'venice.chat.message' => 'Chat message processed',
        'venice.image.generated' => 'Image generated',
        'venice.audio.processed' => 'Audio processed',
        'venice.embedding.created' => 'Embedding created',

        // Cache events
        'venice.cache.hit' => 'Cache hit',
        'venice.cache.miss' => 'Cache miss',
        'venice.cache.set' => 'Cache set',
        'venice.cache.clear' => 'Cache cleared',

        // Authentication events
        'venice.auth.success' => 'Authentication successful',
        'venice.auth.failure' => 'Authentication failed',
        'venice.auth.refresh' => 'Token refreshed',

        // Resource events
        'venice.resource.created' => 'Resource created',
        'venice.resource.updated' => 'Resource updated',
        'venice.resource.deleted' => 'Resource deleted',

        // Plugin events
        'venice.plugin.registered' => 'Plugin registered',
        'venice.plugin.unregistered' => 'Plugin unregistered',
        'venice.plugin.error' => 'Plugin error occurred'
    ];

    /**
     * Constructor
     *
     * @param Logger $logger Logger instance
     */
    public function __construct(Logger $logger) {
        $this->dispatcher = new EventDispatcher();
        $this->logger = $logger;
    }

    /**
     * Dispatch an event
     *
     * @param object $event Event object
     * @return object The event after being handled
     */
    public function dispatch(object $event): object {
        try {
            $eventName = $this->getEventName($event);

            $this->logger->debug('Dispatching event', [
                'event' => $eventName,
                'data' => $this->getEventData($event)
            ]);

            $this->stats['dispatched']++;

            // Dispatch the event
            $result = $this->dispatcher->dispatch($event, $eventName);

            $this->stats['handled']++;

            $this->logger->debug('Event handled', [
                'event' => $eventName,
                'listeners' => count($this->dispatcher->getListeners($eventName))
            ]);

            return $result;
        } catch (\Exception $e) {
            $this->stats['errors']++;
            $this->logger->error('Event dispatch error', [
                'event' => $eventName ?? 'unknown',
                'error' => $e->getMessage()
            ]);
            throw new VeniceException('Event dispatch failed: ' . $e->getMessage());
        }
    }

    /**
     * Add event listener
     *
     * @param string $eventName Event name
     * @param callable $listener Event listener
     * @param int $priority Listener priority
     * @return void
     */
    public function addListener(string $eventName, callable $listener, int $priority = 0): void {
        if (!$this->isValidEventType($eventName)) {
            throw new VeniceException("Invalid event type: {$eventName}");
        }

        $this->dispatcher->addListener($eventName, $listener, $priority);

        $this->logger->debug('Event listener added', [
            'event' => $eventName,
            'priority' => $priority
        ]);
    }

    /**
     * Alias for addListener() - provides standard addEventListener API
     *
     * @param string $eventName Event name
     * @param callable $listener Event listener
     * @param int $priority Priority (higher = earlier execution)
     * @return void
     */
    public function addEventListener(string $eventName, callable $listener, int $priority = 0): void {
        $this->addListener($eventName, $listener, $priority);
    }

    /**
     * Remove event listener
     *
     * @param string $eventName Event name
     * @param callable $listener Event listener
     * @return void
     */
    public function removeListener(string $eventName, callable $listener): void {
        $this->dispatcher->removeListener($eventName, $listener);

        $this->logger->debug('Event listener removed', [
            'event' => $eventName
        ]);
    }

    /**
     * Add event subscriber
     *
     * @param EventSubscriberInterface $subscriber Event subscriber
     * @return void
     */
    public function addSubscriber(EventSubscriberInterface $subscriber): void {
        $this->dispatcher->addSubscriber($subscriber);

        $this->logger->debug('Event subscriber added', [
            'subscriber' => get_class($subscriber)
        ]);
    }

    /**
     * Remove event subscriber
     *
     * @param EventSubscriberInterface $subscriber Event subscriber
     * @return void
     */
    public function removeSubscriber(EventSubscriberInterface $subscriber): void {
        $this->dispatcher->removeSubscriber($subscriber);

        $this->logger->debug('Event subscriber removed', [
            'subscriber' => get_class($subscriber)
        ]);
    }

    /**
     * Get listeners for an event
     *
     * @param string|null $eventName Event name
     * @return array Array of listeners
     */
    public function getListeners(?string $eventName = null): array {
        return $this->dispatcher->getListeners($eventName);
    }

    /**
     * Check if event has listeners
     *
     * @param string|null $eventName Event name
     * @return bool True if event has listeners
     */
    public function hasListeners(?string $eventName = null): bool {
        return $this->dispatcher->hasListeners($eventName);
    }

    /**
     * Get event statistics
     *
     * @return array Event statistics
     */
    public function getStats(): array {
        return $this->stats;
    }

    /**
     * Reset event statistics
     */
    public function resetStats(): void {
        $this->stats = [
            'dispatched' => 0,
            'handled' => 0,
            'errors' => 0
        ];
    }

    /**
     * Get registered event types
     *
     * @return array Event types and descriptions
     */
    public function getEventTypes(): array {
        return self::EVENT_TYPES;
    }

    /**
     * Check if event type is valid
     *
     * @param string $eventName Event name
     * @return bool True if event type is valid
     */
    private function isValidEventType(string $eventName): bool {
        return isset(self::EVENT_TYPES[$eventName]);
    }

    /**
     * Get event name from event object
     *
     * @param object $event Event object
     * @return string Event name
     */
    private function getEventName(object $event): string {
        if (method_exists($event, 'getName')) {
            return $event->getName();
        }
        return get_class($event);
    }

    /**
     * Get event data for logging
     *
     * @param object $event Event object
     * @return array Event data
     */
    private function getEventData(object $event): array {
        if (method_exists($event, 'toArray')) {
            return $event->toArray();
        }
        return get_object_vars($event);
    }
}

/**
 * Base event class for all Venice events
 */
abstract class Event {
    /** @var string Event name */
    protected string $name;

    /** @var array Event data */
    protected array $data;

    /** @var float Event timestamp */
    protected float $timestamp;

    /**
     * Constructor
     *
     * @param string $name Event name
     * @param array $data Event data
     */
    public function __construct(string $name, array $data = []) {
        $this->name = $name;
        $this->data = $data;
        $this->timestamp = microtime(true);
    }

    /**
     * Get event name
     *
     * @return string Event name
     */
    public function getName(): string {
        return $this->name;
    }

    /**
     * Get event data
     *
     * @return array Event data
     */
    public function getData(): array {
        return $this->data;
    }

    /**
     * Get event timestamp
     *
     * @return float Event timestamp
     */
    public function getTimestamp(): float {
        return $this->timestamp;
    }

    /**
     * Convert event to array
     *
     * @return array Event as array
     */
    public function toArray(): array {
        return [
            'name' => $this->name,
            'data' => $this->data,
            'timestamp' => $this->timestamp
        ];
    }
}

/**
 * Interface for event subscribers
 */
interface EventSubscriberInterface {
    /**
     * Get subscribed events
     *
     * @return array Array of events and their handlers
     */
    public static function getSubscribedEvents(): array;
}
