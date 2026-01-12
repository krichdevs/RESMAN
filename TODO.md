# TODO: Fix View Details Buttons in RoomsPage

## Tasks
- [x] Import RoomDetailsModal and roomsApi into RoomsPage.tsx
- [x] Add React state: selectedRoom (Room | null) and isModalOpen (boolean)
- [x] Create handleViewDetails function: async fetch room data, set selectedRoom, open modal
- [x] Add onClick handler to "View Details" button calling handleViewDetails with room.id
- [x] Render RoomDetailsModal at the end of the component with mapped props (equipment as array, floor as number, availability as "Available")
- [x] Test the modal opens and displays correct data when clicking "View Details"
- [x] Ensure no errors in fetching data or rendering modal
