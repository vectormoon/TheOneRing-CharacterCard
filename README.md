# 魔戒TRPG角色自动卡

✨ 目前支持基础规则书中种族内容

## 如果下载&使用

### 下载
本仓库[下载地址](https://github.com/vectormoon/TheOneRing-CharacterCard/releases)下载 ```latest``` 版本的 ```Source Code```，解压后直接运行```TheOneRing-CharacterCard.html```文件即可

### 人物卡数据的保存与导出

**❗❗❗导出PDF/打印：** 为了保证完整性，需要在打印界面的“更多设置”中设置：
- 背景图形：✅️

**角色信息的导出：** 通过```TheOneRing-CharacterCard.html```文件最底部的**导出角色信息**按钮将角色信息文件下载到本地；

**角色信息的导入：** 通过```TheOneRing-CharacterCard.html```文件最底部的**读取角色信息**按钮上传角色信息文件加载人物数据； 

## 海豹骰指令
[配置文件位置](https://github.com/vectormoon/TheOneRing-CharacterCard/blob/main/sealdice/lordice.js)

| 指令格式 | 描述 | 示例 | 示例结果说明 |
| :--- | :--- | :--- | :--- |
| `.lor` | 基础 d12 骰 | `.lor` | 掷出一个 d12 |
| `.lor[number]` | 技能加成骰 | `.lor3` | 结果为 d12 + 3d6 |
| `.lor[number]adv` | 优势骰 | `.lor3adv` | 在加成 3 的基础上取优势 |
| `.lor[number]dis` | 劣势骰 | `.lor3dis` | 在加成 3 的基础上取劣势 |
