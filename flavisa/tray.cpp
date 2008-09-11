#include "stdafx.h"

// Global variables.
NOTIFYICONDATA iconData;

HWND createWindow(HINSTANCE hInstance) {
	WNDCLASS wndClass;
	HWND hWnd;

	// Set up a Window Class ...
	wndClass.hIcon=LoadIcon(NULL, IDI_APPLICATION);
	wndClass.hCursor=LoadCursor(NULL, IDC_ARROW);
	wndClass.hbrBackground=(HBRUSH)COLOR_WINDOW;
	wndClass.cbWndExtra=0;
	wndClass.cbClsExtra=0;
	wndClass.hInstance=hInstance;
	wndClass.lpfnWndProc=(WNDPROC)WndProc;
	wndClass.lpszClassName=APP_WND_CLASSNAME;
	wndClass.lpszMenuName=NULL;
	wndClass.style=CS_DBLCLKS;
	if (!RegisterClass(&wndClass)) {
		ErrorExit(_T("RegisterClass"));
	}

	// And create a window of that class, to catch messages.
	if (!(hWnd=CreateWindow(
		APP_WND_CLASSNAME, _T("test window"), WS_POPUP,
		0, 0, 0, 0, NULL, NULL, hInstance, NULL
	))) {
		ErrorExit(_T("CreateWindow"));
	}

	return hWnd;
}

void createTrayIcon(HWND hWnd, HINSTANCE hInstance) {
	iconData.cbSize=sizeof(NOTIFYICONDATA);
	iconData.uID=1;
	iconData.uFlags=NIF_ICON|NIF_MESSAGE|NIF_TIP;
	iconData.hIcon=(HICON)LoadImage(
		hInstance,
		MAKEINTRESOURCE(1),
		IMAGE_ICON,
		16, 16,
		LR_DEFAULTCOLOR
	);
	iconData.hWnd=hWnd;
	iconData.uCallbackMessage=SWM_TRAYMSG;
	lstrcpyn(
		iconData.szTip,
		_T("Flavisa"),
		sizeof(iconData.szTip)/sizeof(TCHAR)
	);
	if (!Shell_NotifyIcon(NIM_ADD, &iconData)) {
		ErrorExit(_T("Shell_NotifyIcon"));
	}
	if (iconData.hIcon && DestroyIcon(iconData.hIcon)) {
		iconData.hIcon=NULL;
	}
}

void ShowContextMenu(HWND hWnd) {
	POINT pt;
	GetCursorPos(&pt);
	HMENU hMenu=CreatePopupMenu();
	if (hMenu) {
		InsertMenu(hMenu, -1, MF_BYPOSITION, SWM_EXIT, _T("Exit"));

		// note:	must set window to the foreground or the
		//			menu won't disappear when it should
		SetForegroundWindow(hWnd);

		TrackPopupMenu(
			hMenu,
			TPM_BOTTOMALIGN|TPM_RIGHTALIGN,
			pt.x, pt.y, 0, hWnd, NULL
		);
		DestroyMenu(hMenu);
	}
}

INT_PTR CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam) {
	switch (message) {
	case SWM_TRAYMSG:
		switch(lParam) {
		case WM_LBUTTONDBLCLK:
			break;

		case WM_RBUTTONDOWN:
		case WM_CONTEXTMENU:
			ShowContextMenu(hWnd);
			break;
		}
		break;

	case WM_TIMER:
		switch(wParam) {
		case SWM_CHECKFLASH:
			checkFlashPlaying();
			break;
		}
		break;

	case WM_COMMAND:
		int wmId, wmEvent;

		wmId   =LOWORD(wParam);
		wmEvent=HIWORD(wParam);

		switch (wmId) {
		case SWM_EXIT:
			DestroyWindow(hWnd);
			break;
		}

		return 1;

	case WM_CLOSE:
		DestroyWindow(hWnd);
		break;

	case WM_DESTROY:
		iconData.uFlags=0;
		Shell_NotifyIcon(NIM_DELETE, &iconData);
		PostQuitMessage(0);
		break;
	}

	return DefWindowProc(hWnd, message, wParam, lParam);
}
