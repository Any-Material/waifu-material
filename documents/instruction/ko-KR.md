# 읽어주세요

*Nozomi Material* (은)는 [hitomi.la](https://hitomi.la) (을)를 위한 **Downloader** / **Viewer** 입니다.<br>

- [추가 상호작용](#추가-상호작용)
  * [전체화면 단축키](#전체화면-단축키)
  * [Terminal 단축키](#terminal-단축키)
  * [Paging 관련](#paging-관련)
  * [Gallery 관련](#gallery-관련)
- [검색 심화](#검색-심화)
  * [Tag](#tag)
  * [Prefix](#prefix)
  * [Grouping](#grouping)
  * [종합 예시](#종합-예시)
- [설정 심화](#설정-심화)
  * [Download](#Download)

# 추가 상호작용

해당 단락은 추가 상호작용들을 기술하고 있습니다.<br>

## 전체화면 단축키

<kbd>F11</kbd> (을)를 누르면 전체화면으로 **진입**하며,<br>
<kbd>F11</kbd> (을)를 또다시 누르면 전체화면을 **종료**합니다.<br>
또한 전체화면 **진입**시, **TitleBar**, **Paging** (이)가 불가시화 합니다.<br>

## Terminal 단축키

<kbd>F5</kbd> (을)를 누르면 **Terminal** 이 활성화 됩니다.

## Paging 관련

**Paging** (을)를 위한 추가 상호작용으로, **Paging** (이)가 가시적으로 활성화가 되어있다면,<br>
<kbd><</kbd> (이)는 1 만큼 **차감**시키고, <kbd>></kbd> (이)는 1 만큼 **증가**시킵니다.<br>

## Gallery 관련

**Gallery** (을)를 위한 추가 상호작용입으로,<br>
다음 사진과 같이 **Chip** 위에 **mouse** (을)를 올린뒤,<br>

![Screenshot](../images/automation.jpg)

**left-click** 시 검색창에 검색어가 **추가**되며,<br>
**right-click** 시 검색창에서 검색어가 **제거**됩니다.<br>

# 검색 심화

해당 단락은 검색의 심화를 기술하고 있습니다.<br>

## Tag

*Nozomi Material* (은)는 추가 검색어 `id:<number>`, `status:<NONE/FINISHED/WORKING/QUEUED/PAUSED/ERROR/FAVORITE>` (을)를 지원합니다.<br>

## Prefix

접두어는 `AND`, `INCLUDE`, `EXCLUDE` (와)과 같이 3종류가 있습니다.<br>
접두어는 검색어 혹은 묶음의 앞에 추가해 사용 가능하며, 기본 접두어는 `AND` 입니다.<br>

```
AND
```

**해당 접두어가 붙은 검색어의 결과** 와(과) 이전 결과 간의 **공통**된 결과를 연산합니다.<br>
*이전 결과가 없을 경우 `INCLUDE` (와)과 동일한 동작을 합니다*<br>

```
INCLUDE (+)
```

**해당 접두어가 붙은 검색어의 결과** (을)를 이전 결과에 **추가**합니다.<br>

```
EXCLUDE (-)
```

**해당 접두어가 붙은 검색어의 결과** (을)를 이전 결과에서 **제거**합니다.<br>

## Grouping

`()` (을)를 사용해 검색어들을 묶을 수 있으며, 묶음은 **중첩**이 가능합니다.<br>
묶음 내부에서 연산된 결과는 접두어에 따라 묶음 밖 결과에 영향을 끼칩니다.<br>

## 종합 예시

다음은 검색어, 접두어, 묶음의 조합 예시입니다.<br>

```
(language:korean +language:english) type:manga
```

*한국어 혹은 영어로 번역된 만화를 연산합니다.*<br>

```
tag:uncensored -(type:manga -(language:korean))
```

*한국어로 번역된 미검열 (만화가 아닌)갤러리를 연산합니다.*<br>

# 설정 심화

해당 단락은 **config.json** 의 설정 심화를 기술하고 있습니다.<br>

## Download

```json
	"download": {
		"folder": "{id}",
		"directory": "./download",
		"max_threads": 5,
		"max_working": 5
	}
```
**Folder** (은)는 **GalleryBlock** (이)가 지원하는 모든 속성을 지원하며 해당 Gallery 의 대응하는 속성 값을 삽입 가능합니다.<br>
다음은 Gallery#9(Eat The Rich!) (을)를 대상으로 **folder** 에 속성 값을 추가한 예시입니다.<br>

```json
{
	"folder": "[{type}]_{id}_{title}" // [doujinshi]_9_Eat The Rich!
}
```
