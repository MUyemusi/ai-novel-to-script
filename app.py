import streamlit as st
from datetime import datetime

st.set_page_config(page_title="AI 小说转剧本工具", layout="wide")

st.title("AI 小说转剧本工具")
st.markdown(
    "本工具用于将 3 个章节以上的小说文本转换为结构化 YAML 剧本初稿。"
)

with st.sidebar:
    st.header("项目信息")
    st.write("当前版本：v0.1.0")
    st.write("Schema 版本：v1.1")
    st.write("时区：中国北京时间 UTC+08:00")
    st.write("当前阶段：项目初始化")

st.write("---")

novel_text = st.text_area("粘贴小说文本", height=280)
uploaded_file = st.file_uploader("上传小说 TXT 文件", type=["txt"])

if uploaded_file is not None:
    content = uploaded_file.read().decode("utf-8", errors="ignore")
    novel_text = content
    st.success("已加载上传的小说文本。")

if st.button("生成剧本 YAML"):
    st.info(
        "项目初始化完成，核心转换功能将在后续 PR 中实现。"
    )

st.write("---")
st.write("示例时间格式：2026-06-05T10:00:00+08:00")
