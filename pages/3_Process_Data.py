import streamlit as st

st.title("Process Data")

left, right = st.columns([1, 2])
with left:
    st.subheader("Chat Guide")
    st.write("Stub: intent buttons and assistant messages")
    st.button("clean")
    st.button("merge")
    st.button("explain")
    st.button("next")

with right:
    st.subheader("Pipeline Preview")
    st.write("Stub: before/after stats and config summary")

st.divider()
if st.button("Run Pipeline"):
    st.info("Stub: run preprocessing and feature generation")
