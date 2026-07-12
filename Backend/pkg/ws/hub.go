package ws

import (
	"encoding/json"
	"sync"
)

type Event struct {
	Event string          `json:"event"`
	Data  json.RawMessage `json:"data"`
}

type Hub struct {
	mu          sync.RWMutex
	userClients map[int64]map[*Client]bool
}

func NewHub() *Hub {
	return &Hub{
		userClients: make(map[int64]map[*Client]bool),
	}
}

func (h *Hub) Register(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	id := client.BotUserID()
	if h.userClients[id] == nil {
		h.userClients[id] = make(map[*Client]bool)
	}
	h.userClients[id][client] = true
}

func (h *Hub) Unregister(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	id := client.BotUserID()
	clients := h.userClients[id]
	if clients == nil {
		return
	}
	delete(clients, client)
	if len(clients) == 0 {
		delete(h.userClients, id)
	}
	close(client.send)
}

func (h *Hub) SendToUser(botUserID int64, payload []byte) {
	h.mu.RLock()
	clients := h.userClients[botUserID]
	copyClients := make([]*Client, 0, len(clients))
	for client := range clients {
		copyClients = append(copyClients, client)
	}
	h.mu.RUnlock()

	for _, client := range copyClients {
		select {
		case client.send <- payload:
		default:
			go func(cl *Client) {
				h.Unregister(cl)
				_ = cl.conn.Close()
			}(client)
		}
	}
}

func (h *Hub) BroadcastEvent(botUserID int64, event string, data any) {
	raw, err := json.Marshal(data)
	if err != nil {
		return
	}
	msg, err := json.Marshal(Event{Event: event, Data: raw})
	if err != nil {
		return
	}
	h.SendToUser(botUserID, msg)
}
