import { useRef, useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import axios from 'axios';

import RecipeEditor from '../components/recipe_edit/RecipeEditor';
import useToast from '../hooks/toast/useToast';
import StandardButton from '../components/common/buttons/StandardButton';
import HashTagEditor from '../components/common/HashtagEditor';
import useModal from '../hooks/useModal';
import ServiceReady from '../components/common/ServiceReady';

const Wrapper = styled.div`
  margin: 20px auto;
  max-width: ${process.env.REACT_APP_WEB_MAX_WIDTH};
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media (max-width: 768px) {
    margin-bottom: 8px;
    padding: 0 8px;
  }
`;

const RecipeTitleInput = styled.input`
  border: none;
  width: 30%;
  height: 50px;
  padding-left: 0.5rem;
  font-size: 1.5rem;
  background-color: transparent;
  color: ${({ isDark }) => (isDark ? 'white' : 'black')};
  &:focus {
    outline: none;
    border-bottom: 1px solid #dadde6;
  }
  @media screen and (max-width: ${process.env.REACT_APP_MOBILE_WIDTH}) {
    width: 100%;
  }
`;

const ThumbnailInput = styled.input`
  border: solid 1px #dadde6;
  border-radius: 5px;
  padding-left: 20px;
  height: 50px;
  background-color: transparent;
  color: ${({ isDark }) => (isDark ? 'white' : 'black')};
  &:focus {
    outline: none;
  }
  @media screen and (max-width: ${process.env.REACT_APP_MOBILE_WIDTH}) {
    width: 100%;
  }
`;

const Buttons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const RecipeEditPage = () => {
  const editorRef = useRef();
  const titleRef = useRef();
  const thumbnailRef = useRef();
  const [images, setImages] = useState();
  const [tagList, setTagList] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const addMessage = useToast();
  const history = useHistory();

  const modalConfig = { width: 50, height: 45, padding: 2.5, overflow: 'hidden' };
  const { showModal, ModalContainer } = useModal(modalConfig);
  const { isDarkMode } = useSelector(state => state.theme);
  const location = useLocation();

  useEffect(() => {
    if (!location.state || location.state.editPostId.length <= 0) {
      return;
    }
    (async () => {
      try {
        const {
          data: { recipe },
        } = await axios.get(
          `${process.env.REACT_APP_ENDPOINT_URL}/recipes/${location.state.editPostId}`,
        );
        titleRef.current.value = recipe.title;
        const editorInstance = editorRef.current.getInstance();
        editorInstance.insertText(recipe.content);
        thumbnailRef.current.value = recipe.thumbnail_url;
        setTagList(recipe.hashtags);
        setIsUpdateMode(true);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [location.state]);
  const handleSave = async () => {
    const title = titleRef.current.value;
    const editorInstance = editorRef.current.getInstance();
    const recipeContent = editorInstance.getHTML();
    const thumbnail_url = thumbnailRef.current.value;

    if (!title.trim().length) {
      titleRef.current.focus();
      addMessage({ mode: 'info', message: '제목을 입력해주세요', delay: 1000 });
      return;
    }

    if (!recipeContent.trim().length) {
      editorInstance.mdEditor.el.childNodes[1].focus();
      addMessage({ mode: 'info', message: '본문을 입력해주세요', delay: 1000 });
      return;
    }

    setDisabled(true);

    try {
      const method = isUpdateMode ? 'patch' : 'post';
      const updatingPostId = isUpdateMode ? `/${location.state.editPostId}` : '';
      const {
        data: {
          message,
          data: { postId },
        },
        status,
      } = await axios[method](
        `${process.env.REACT_APP_ENDPOINT_URL}/recipes${updatingPostId}`,
        {
          title,
          content: recipeContent,
          thumbnail_url,
          hashtags: tagList,
        },
        {
          withCredentials: true,
        },
      );
      if (status === 201 || status === 200) {
        addMessage({ message, delay: 1000 });
        history.push({
          pathname: '/recipes',
          search: '?sort=dd',
          state: { postId },
        });
      } else {
        addMessage({ mode: 'error', message: '레시피 등록 중 오류가 발생하였습니다.' });
        history.push('/recipes');
      }
    } catch (err) {
      addMessage({ mode: 'error', message: err.response.data.message });
      history.push('/recipes');
    }
  };

  return (
    <Wrapper>
      <RecipeTitleInput isDark={isDarkMode} ref={titleRef} type="text" placeholder="제목" />
      <RecipeEditor editorRef={editorRef} setImages={setImages} />
      <ThumbnailInput
        isDark={isDarkMode}
        ref={thumbnailRef}
        type="text"
        placeholder="썸네일로 사용할 src를 붙여넣어 주세요 ex) https://recipe-upload-image.favorite-food.jpeg"
      />
      <HashTagEditor tagList={tagList} updateTagList={setTagList} width="100%" />
      <Buttons>
        {isUpdateMode ? (
          <StandardButton onClick={handleSave}>수정</StandardButton>
        ) : (
          <>
            <StandardButton
              backgroundColor="#fc9f77"
              padding="0.5rem 1rem"
              height="auto"
              onClick={showModal}
              disabled={disabled}
            >
              임시저장
            </StandardButton>
            <StandardButton
              padding="0.5rem 1rem"
              height="auto"
              onClick={handleSave}
              disabled={disabled}
            >
              작성
            </StandardButton>
          </>
        )}
      </Buttons>
      <ModalContainer>
        <ServiceReady />
      </ModalContainer>
    </Wrapper>
  );
};

export default RecipeEditPage;
