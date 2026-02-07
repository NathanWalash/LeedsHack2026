import streamlit as st

st.title("Showcase")

st.subheader("Auto Summary")
st.write("Stub: generated summary of results")

st.subheader("Assets")
st.file_uploader("Upload screenshots", type=["png", "jpg"], accept_multiple_files=True)

st.subheader("Tags")
st.text_input("Tags (comma-separated)")

st.button("Publish Showcase")
st.info("Stub: generate exports (config.json, predictions.csv, merged_df.csv)")
