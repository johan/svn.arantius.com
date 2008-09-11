#define SWM_TRAYMSG      (WM_USER + 100)
#define SWM_EXIT         (WM_USER + 101)
#define SWM_CHECKFLASH   (WM_USER + 102)

#define APP_WND_CLASSNAME	_T("flavisa")

HWND createWindow(HINSTANCE hInstance);
void createTrayIcon(HWND hWnd, HINSTANCE hInstance);
void ShowContextMenu(HWND hWnd);
INT_PTR CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam);
