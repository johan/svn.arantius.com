#pragma once
#define WIN32_LEAN_AND_MEAN
#include <stdio.h>
#include <tchar.h>
#include <windows.h>
#include <psapi.h>
#include <strsafe.h>
#include <shellapi.h>
#include <commctrl.h>
#include <time.h>

#include "resource.h"

#using <System.dll>
using namespace System;
using namespace System::ComponentModel;
using namespace System::Diagnostics;

#define CHECK_FREQUENCY 2 // seconds
#define IDLE_RATIO 0.25

#define SWM_TRAYMSG      (WM_USER + 100)
#define SWM_EXIT         (WM_USER + 101)
#define SWM_CHECKFLASH   (WM_USER + 102)

#define APP_WND_CLASSNAME	_T("flavisa")

// Global variables.
NOTIFYICONDATA iconData;
double procTimeBefore=0, procTime=0;
HWND deskWin;
RECT deskRect;

// http://msdn.microsoft.com/en-us/library/ms680582(VS.85).aspx
void ErrorExit(LPTSTR lpszFunction) {
	LPVOID lpMsgBuf;
	LPVOID lpDisplayBuf;
	DWORD dw=GetLastError();

	FormatMessage(
		FORMAT_MESSAGE_ALLOCATE_BUFFER |
		FORMAT_MESSAGE_FROM_SYSTEM |
		FORMAT_MESSAGE_IGNORE_INSERTS,
		NULL,
		dw,
		MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT),
		(LPTSTR) &lpMsgBuf,
		0, NULL
	);

	lpDisplayBuf=(LPVOID)LocalAlloc(LMEM_ZEROINIT,
		(lstrlen((LPCTSTR)lpMsgBuf)+lstrlen((LPCTSTR)lpszFunction)+40)*sizeof(TCHAR));
	StringCchPrintf((LPTSTR)lpDisplayBuf,
		LocalSize(lpDisplayBuf) / sizeof(TCHAR),
		TEXT("%s failed with error %d: %s"),
		lpszFunction, dw, lpMsgBuf
	);
	MessageBox(NULL, (LPCTSTR)lpDisplayBuf, TEXT("Error"), MB_OK);

	LocalFree(lpMsgBuf);
	LocalFree(lpDisplayBuf);
	ExitProcess(dw);
}

bool ScanModules (DWORD processID) {
	HMODULE hMods[1024];
	HANDLE hProcess;
	DWORD cbNeeded;

	// Get a list of all the modules in this process.
	hProcess=OpenProcess(
		PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, processID
	);
	if (NULL==hProcess) return 0;

	if (EnumProcessModules(hProcess, hMods, sizeof(hMods), &cbNeeded)) {
		for (unsigned int i=0; i<cbNeeded/sizeof(HMODULE) && i<1024; i++) {
			TCHAR szModName[MAX_PATH];

			if (GetModuleBaseName(
				hProcess, hMods[i], szModName, sizeof(szModName)/sizeof(TCHAR)
			)) {
				if (0==_wcsicmp(szModName, _T("npswf32.dll"))) {
					CloseHandle(hProcess);
					return 1;
				}
			}
		}
	}

	CloseHandle(hProcess);
	return 0;
}

DWORD FindFlash() {
	DWORD aProcesses[1024], cbNeeded;

	// Get the list of process identifiers.
	if (!EnumProcesses(aProcesses, sizeof(aProcesses), &cbNeeded)) {
		return 0;
	}

	// Calculate how many process identifiers were returned.
	DWORD cProcesses=cbNeeded/sizeof(DWORD);

	for (unsigned int i=0; i<cProcesses && i<1024; i++) {
		if (ScanModules(aProcesses[i])) return aProcesses[i];
	}

	return 0;
}

double getFlashProcTime() {
	DWORD processId=0;
	processId=FindFlash();
	if (!processId) return 0;

	Process^ process=Process::GetProcessById(processId);
	return process->TotalProcessorTime.TotalSeconds;
}

void suspendScreensaver() {
	UINT ssActive=0;
	if (SystemParametersInfo(SPI_GETSCREENSAVEACTIVE, 0, (PVOID)&ssActive, 0)) {
		SystemParametersInfo(SPI_SETSCREENSAVEACTIVE, ssActive, 0, SPIF_SENDCHANGE);
	}
}

bool rectEquals(RECT rect1, RECT rect2) {
	return rect1.top==rect2.top &&
		rect1.right==rect2.right &&
		rect1.left==rect2.left &&
		rect1.bottom==rect2.bottom;
}

void checkFlashPlaying() {
	HWND foreWin;
	RECT foreRect;

	// Skip if the processor has been idle.
	procTimeBefore=procTime;
	procTime=getFlashProcTime();
	if ( (procTime-procTimeBefore) < CHECK_FREQUENCY*IDLE_RATIO ) {
		return;
	}

	// Wait again if flash (or something...) isn't full screen.
	if (foreWin=GetForegroundWindow()) {
		if (GetWindowRect(foreWin, &foreRect)) {
			if (!rectEquals(foreRect, deskRect)) return;
		} else {
			ErrorExit(_T("GetWindowRect"));
		}
	} else {
		ErrorExit(_T("GetForegroundWindow"));
	}

	// We made it through all the tests, suspend the screen saver.
	suspendScreensaver();
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

INT_PTR CALLBACK DlgProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam) {
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

int APIENTRY _tWinMain(
	HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow
) {
	HWND hWnd;
	MSG msg;
	WNDCLASS wndClass;

	InitCommonControls();

	// Set up a Window Class ...
	wndClass.hIcon=LoadIcon(NULL, IDI_APPLICATION);
	wndClass.hCursor=LoadCursor(NULL, IDC_ARROW);
	wndClass.hbrBackground=(HBRUSH)COLOR_WINDOW;
	wndClass.cbWndExtra=0;
	wndClass.cbClsExtra=0;
	wndClass.hInstance=hInstance;
	wndClass.lpfnWndProc=(WNDPROC)DlgProc;
	wndClass.lpszClassName=APP_WND_CLASSNAME;
	wndClass.lpszMenuName=NULL;
	wndClass.style=CS_DBLCLKS;
	RegisterClass(&wndClass);

	// And create a window of that class, to catch messages.
	hWnd=CreateWindow(
		APP_WND_CLASSNAME, _T("test window"), WS_POPUP,
		0, 0, 0, 0, NULL, NULL, hInstance, NULL
	);

	// Set up the system tray.
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

	// Look up the size of the desktop.
	if (deskWin=GetDesktopWindow()) {
		if (!GetWindowRect(deskWin, &deskRect)) {
			ErrorExit(_T("GetWindowRect"));
		}
	} else {
		ErrorExit(_T("GetDesktopWindow"));
	}

	// Set up a timer to repeatedly check flash video status.
	SetTimer(hWnd, SWM_CHECKFLASH, CHECK_FREQUENCY*1000, NULL);

	// Message loop.
	while (GetMessage(&msg, NULL, 0, 0) > 0) {
		TranslateMessage(&msg);
		DispatchMessage(&msg);
	}
 	return (int)msg.wParam;
}
