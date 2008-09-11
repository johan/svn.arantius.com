#include "stdafx.h"

int APIENTRY _tWinMain(
	HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow
) {
	HWND hWnd;
	MSG msg;

	InitCommonControls();
	initDeskRect();

	hWnd=createWindow(hInstance);
	createTrayIcon(hWnd, hInstance);

	// Set up a timer to repeatedly check flash video status.
	SetTimer(hWnd, SWM_CHECKFLASH, CHECK_FREQUENCY*1000, NULL);

	// Message loop.
	while (GetMessage(&msg, NULL, 0, 0) > 0) {
		TranslateMessage(&msg);
		DispatchMessage(&msg);
	}
 	return (int)msg.wParam;
}
