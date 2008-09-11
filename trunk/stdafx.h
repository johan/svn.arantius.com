#pragma once
#define WIN32_LEAN_AND_MEAN

#include <tchar.h>
#include <windows.h>

#include <commctrl.h>
#include <psapi.h>
#include <shellapi.h>
#include <strsafe.h> // For ErrorExit() .

// Bits of this program.
#include "error.h"
#include "flash.h"
#include "tray.h"
